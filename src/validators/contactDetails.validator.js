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
  MISSING_INPUT_ERROR,
  AT_LEAST_TWO_LETTERS_ERROR,
  LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR,
  LEADING_AND_TRAILING_DASHES_ERROR,
  ENTER_SHORTER_ERROR,
  MISSING_AGENT_NAME_ERROR,
  INVALID_TELEPHONE_NUMBER_ERROR,
  PLUS_ZERO_TELEPHONE_NUMBER_ERROR,
  TELEPHONE_NUMBER_SHORT_ERROR,
  TELEPHONE_NUMBER_LONG_ERROR
} = Constants.ValidationErrors

module.exports = class ContactDetailsValidator extends BaseValidator {
  get errorMessages () {
    return {
      'first-name': {
        'any.empty': MISSING_INPUT_ERROR('first name'),
        'any.required': MISSING_INPUT_ERROR('first name'),
        'string.min': AT_LEAST_TWO_LETTERS_ERROR('first name'),
        'custom.invalid': LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR('first name'),
        'custom.no-leading-and-trailing-dashes': LEADING_AND_TRAILING_DASHES_ERROR('first name'),
        'string.max': ENTER_SHORTER_ERROR({ field: 'first name', max: Contact.firstName.length.max })
      },
      'last-name': {
        'any.empty': MISSING_INPUT_ERROR('last name'),
        'any.required': MISSING_INPUT_ERROR('last name'),
        'string.min': AT_LEAST_TWO_LETTERS_ERROR('last name'),
        'custom.invalid': LETTERS_HYPHENS_SPACES_AND_APOSTROPHES_ERROR('last name'),
        'custom.no-leading-and-trailing-dashes': LEADING_AND_TRAILING_DASHES_ERROR('last name'),
        'string.max': ENTER_SHORTER_ERROR({ field: 'last name', max: Contact.lastName.length.max })
      },
      'agent-company': {
        'any.empty': MISSING_AGENT_NAME_ERROR,
        'any.required': MISSING_AGENT_NAME_ERROR,
        'string.max': ENTER_SHORTER_ERROR({ field: 'trading, business or company name', max: Account.accountName.length.max })
      },
      'telephone': {
        'any.empty': MISSING_INPUT_ERROR('telephone number'),
        'any.required': MISSING_INPUT_ERROR('telephone number'),
        'custom.invalid': INVALID_TELEPHONE_NUMBER_ERROR,
        'custom.plus-zero': PLUS_ZERO_TELEPHONE_NUMBER_ERROR,
        'custom.min': TELEPHONE_NUMBER_SHORT_ERROR(AddressDetail.telephone.length.min),
        'custom.max': TELEPHONE_NUMBER_LONG_ERROR({ max: AddressDetail.telephone.length.maxDigits, string: 'digits' }),
        'string.max': TELEPHONE_NUMBER_LONG_ERROR({ max: AddressDetail.telephone.length.max, string: 'characters' })
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
