'use strict'

const PdfMake = require('pdfmake')
const moment = require('moment')

const { LIMITED_COMPANY, LIMITED_LIABILITY_PARTNERSHIP } = require('../dynamics').PERMIT_HOLDER_TYPES
const ltdPermitTypes = [ LIMITED_COMPANY.type, LIMITED_LIABILITY_PARTNERSHIP.type ]

const findAnswer = (sections, answerHeading) => {
  return sections.find(({ headingId }) => headingId === answerHeading)
}

const findSingleAnswer = (sections, answerHeading) => {
  return findAnswer(sections, answerHeading).answers.map(a => a.answer).shift()
}

const createPdfDocDefinition = (sections, application) => {
  const permitHeading = findAnswer(sections, 'section-permit-heading')
  const permitAuthor = findAnswer(sections, 'section-contact-name-heading')
  const permitHolderType = findSingleAnswer(sections, 'section-permit-holder-type-heading')

  const sectionsWithoutDob = cleanseSections(sections, permitHolderType)

  const title = 'Application for ' + permitHeading.answers.map(a => a.answer).join(' ')
  const timestamp = moment()
  const declaration = [
    {
      text: 'Declaration',
      style: 'th'
    },
    [
      {
        text: 'The operator confirmed that:',
        style: 'td'
      },
      {
        'ul': [
          'their operation meets the standard rules',
          'a written management system will be in place before they start operating',
          'they were authorised to apply for the permit by the organisation or individual responsible',
          'the information they gave was true'
        ]
      }
    ]
  ]
  const body = sectionsWithoutDob.map(section => {
    return [
      {
        text: section.heading,
        style: 'th'
      },
      {
        text: section
          .answers
          .filter(a => typeof a.answer === 'string')
          .map(a => a.answer).join('\n'),
        style: 'td'
      }
    ]
  }).concat([declaration])
  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [ 25, 25, 25, 25 ],
    defaultStyle: {
      font: 'helvetica',
      fontSize: 12,
      lineHeight: 1.35,
      margin: [0, 0, 0, 6]
    },
    styles: {
      h1: {
        fontSize: 17,
        bold: true,
        margin: [0, 0, 0, 12]
      },
      h2: {
        fontSize: 14,
        bold: true,
        margin: [0, 12, 0, 6]
      },
      tableApplication: {
        margin: [0, 12, 0, 12]
      },
      th: {
        bold: true,
        margin: [0, 3, 0, 3]
      },
      td: {
        margin: [0, 3, 0, 3]
      }
    },
    info: {
      title,
      author: permitAuthor.answers.map(a => a.answer).join(' '),
      subject: 'Application for an Environmental Permit',
      keywords: 'environmental permit, environment agency, application',
      creator: 'Environment Agency',
      producer: 'GOV.UK',
      creationDate: timestamp.format('DD/MM/YYYY')
    },
    content: [
      { text: title, style: 'h1' },
      'Application reference: ' + application.applicationNumber,
      `Submitted on ${timestamp.format('DD MMM YYYY')} at ${timestamp.format('h:mma')}`,
      'This is the information submitted by the applicant. It has not been checked or duly made.',
      {
        table: {
          headerRows: 0,
          body: body
        },
        style: 'tableApplication',
        layout: 'lightHorizontalLines'
      }
    ]
  }
}

const cleanseSections = (sections, permitHolderType) => {
  return sections.map(section => {
    const { heading, headingId, answers, links } = section

    // If this is a limited company or LLC and the heading ends in 'birth' then
    // this section contains a DoB so cleanse it
    if (ltdPermitTypes.includes(permitHolderType) && heading.slice(-5) === 'birth') {
      return {
        heading,
        headingId,
        answers: cleanseDobAnswers(answers),
        links
      }
    }

    // If this is not a limited company or LLC and the heading is 'Permit holder'
    // then this answer may contain a DoB starting 'Date of birth:'
    if (!ltdPermitTypes.includes(permitHolderType) && heading === 'Permit holder') {
      return {
        heading,
        headingId,
        answers: cleanseDobAnswers(answers, 'Date of birth'),
        links
      }
    }

    // None of the above apply so return the section as-is
    return section
  })
}

const cleanseDobAnswers = (answers, targetAnswer = null) => {
  return answers.map(item => {
    // DoBs only appear in the following formats:
    //    Director Name: 1 January 2019
    //    Date of birth: 1 January 2019
    // if the current item answer is an object then it can't contain a DoB and
    // same if it doesn't contain a colon. So just return the item
    if (typeof item.answer === 'object' || !item.answer.includes(': ')) {
      return item
    }

    const answerText = item.answer.split(': ')

    // If we have some text we're looking for (eg. 'Date of birth') and the
    // text before the colon doesn't match then just return the item
    if (targetAnswer && answerText[0] !== targetAnswer) {
      return item
    }

    // We are here if we have no specific text to look for, or we do and we matched
    // So use regex to remove the number from the start of the DoB and return
    const cleansedAnswer = `${answerText[0]}: ${answerText[1].match(/[A-Za-z].*/)[0]}`
    return {
      answerId: item.answerId,
      answer: cleansedAnswer
    }
  })
}

const printer = new PdfMake({
  helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  timesRoman: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  }
})

module.exports = {
  createPdfDocDefinition: createPdfDocDefinition,
  createPDFStream: (sections, application) => {
    return printer
      .createPdfKitDocument(
        createPdfDocDefinition(sections, application)
      )
  },
  createPDF: async (sections, application) => {
    try {
      const doc = printer
        .createPdfKitDocument(createPdfDocDefinition(sections, application))

      let chunks = []

      doc.on('readable', function () {
        let chunk
        while ((chunk = doc.read(9007199254740991)) !== null) {
          chunks.push(chunk)
        }
      })

      const end = new Promise(function (resolve, reject) {
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
      })

      doc.end()

      return end
    } catch (err) {
      throw Error('PDF render failed', err)
    }
  }
}
