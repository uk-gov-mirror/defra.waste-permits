'use strict'

const Joi = require('@hapi/joi')
const BaseValidator = require('./base.validator')
const Constants = require('../constants')
const Account = require('../persistence/entities/account.entity')
const AddressDetail = require('../persistence/entities/addressDetail.entity')
const Contact = require('../persistence/entities/contact.entity')

const {
  EMAIL_VALID_REGEX,
  LEADING_AND_TRAILING_DASHES_REGEX,
  LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_REGEX,
  PLUSES_AND_SPACES_REGEX,
  PLUSES_CANNOT_PRECEDE_ZERO,
  PLUSES_SPACES_AND_NUMBERS_REGEX
} = Constants.Validation

const {
  EMPTY_FIRST_NAME_ERROR,
  EMPTY_LAST_NAME_ERROR,
  AT_LEAST_TWO_LETTERS_ERROR,
  LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR,
  LEADING_AND_TRAILING_DASHES_ERROR
} = Constants.ValidationErrors

module.exports = class ContactDetailsValidator extends BaseValidator {
  get errorMessages () {
    return {
      'first-name': {
        'any.empty': EMPTY_FIRST_NAME_ERROR,
        'any.required': EMPTY_FIRST_NAME_ERROR,
        'string.min': `First name ${AT_LEAST_TWO_LETTERS_ERROR}`,
        'custom.invalid': `First name ${LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR}`,
        'custom.no-leading-and-trailing-dashes': `First name ${LEADING_AND_TRAILING_DASHES_ERROR}`,
        'string.max': `Enter a shorter first name with no more than ${Contact.firstName.length.max} characters`
      },
      'last-name': {
        'any.empty': EMPTY_LAST_NAME_ERROR,
        'any.required': EMPTY_LAST_NAME_ERROR,
        'string.min': `Last name ${AT_LEAST_TWO_LETTERS_ERROR}`,
        'custom.invalid': `Last name ${LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR}`,
        'custom.no-leading-and-trailing-dashes': `Last name ${LEADING_AND_TRAILING_DASHES_ERROR}`,
        'string.max': `Enter a shorter last name with no more than ${Contact.lastName.length.max} characters`
      },
      'agent-company': {
        'any.empty': `Enter the agent’s trading, business or company name`,
        'any.required': `Enter the agent’s trading, business or company name`,
        'string.max': `Enter a shorter trading, business or company name with no more than ${Account.accountName.length.max} characters`
      },
      'telephone': {
        'any.empty': `Enter a telephone number`,
        'any.required': `Enter a telephone number`,
        'custom.invalid': `Telephone number can only include numbers, spaces and the + sign. Please remove any other characters.`,
        'custom.plus-zero': `The + sign for international numbers should be at the start of the number, followed by a number 1 to 9, not a 0`,
        'custom.min': `That telephone number is too short. It should have at least ${AddressDetail.telephone.length.min} characters. Make sure you include the area code.`,
        'custom.max': `That telephone number is too long. It should have no more than ${AddressDetail.telephone.length.maxDigits} digits.`,
        'string.max': `That telephone number is too long. It should have no more than ${AddressDetail.telephone.length.max} characters.`
      },
      'email': {
        'any.empty': `Enter an email address for the main contact`,
        'any.required': `Enter an email address for the main contact`,
        'string.regex.base': `Enter a valid email address for the main contact`,
        'string.max': `Enter a shorter email address for the main contact with no more than ${Contact.email.length.max} characters`
      }
    }
  }

  get formValidators () {
    return {
      'first-name': Joi
        .string()
        .min(2)
        .max(Contact.firstName.length.max)
        .required(),
      'last-name': Joi
        .string()
        .min(2)
        .max(Contact.lastName.length.max)
        .required(),
      'agent-company': Joi
        .string()
        .max(Account.accountName.length.max)
        .when('is-contact-an-agent', {
          is: 'on',
          then: Joi.required(),
          otherwise: Joi.optional() }),
      'telephone': Joi
        .string()
        .max(AddressDetail.telephone.length.max)
        .required(),
      'email': Joi
        .string()
        .max(Contact.email.length.max)
        .regex(EMAIL_VALID_REGEX)
        .required()
    }
  }

  get customValidators () {
    return {
      'first-name': {
        'custom.invalid': (value) => !(LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_REGEX).test(value),
        'custom.no-leading-and-trailing-dashes': (value) => (LEADING_AND_TRAILING_DASHES_REGEX).test(value)
      },
      'last-name': {
        'custom.invalid': (value) => !(LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_REGEX).test(value),
        'custom.no-leading-and-trailing-dashes': (value) => (LEADING_AND_TRAILING_DASHES_REGEX).test(value)
      },
      'telephone': {
        'custom.invalid': (value) => !(PLUSES_SPACES_AND_NUMBERS_REGEX).test(value),
        'custom.plus-zero': (value) => !(PLUSES_CANNOT_PRECEDE_ZERO).test(value),
        'custom.min': (value) => value.replace(PLUSES_AND_SPACES_REGEX, '').length < AddressDetail.telephone.length.min,
        'custom.max': (value) => value.replace(PLUSES_AND_SPACES_REGEX, '').length > AddressDetail.telephone.length.maxDigits
      }
    }
  }
}
