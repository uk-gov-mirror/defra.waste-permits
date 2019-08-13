'use strict'

const BaseController = require('./base.controller')
const RecoveryService = require('../services/recovery.service')
const { MCP_AIR_DISPERSION_MODELLING, MCP_HAS_EXISTING_PERMIT, MCP_UNDER_500_HOURS, TASK_LIST } = require('../routes')
const { STATIONARY_SG } = require('../dynamics').MCP_TYPES

module.exports = class ExistingPermitController extends BaseController {
  async doGet (request, h, errors) {
    const pageContext = this.createPageContext(h, errors)

    return this.showView({ h, pageContext })
  }

  async doPost (request, h) {
    let route

    // set determinants to be cleared
    let determinants = {
      bestAvailableTechniquesAssessment: false,
      airDispersionModellingRequired: false,
      screeningToolRequired: false,
      habitatAssessmentRequired: false,
      energyEfficiencyReportRequired: false
    }

    const { taskDeterminants } = await RecoveryService.createApplicationContext(h)

    const { 'existing-permit': existingPermit } = request.payload

    if (existingPermit === 'yes') {
      await taskDeterminants.save(determinants)
      return this.redirect({ h, route: MCP_HAS_EXISTING_PERMIT })
    }

    const { isBespoke, taskDeterminants: { mcpType } } = await RecoveryService.createApplicationContext(h)
    if (isBespoke) {
      // Add changeActivitiesUrl to the list of determinants to be saved.
      // This will be used on the confirm activities screen for the
      // "Change activities and assessments" link.
      route = mcpType === STATIONARY_SG
        ? MCP_AIR_DISPERSION_MODELLING
        : MCP_UNDER_500_HOURS

      determinants = { ...determinants, ...{ changeActivitiesUrl: route } }
    } else {
      route = TASK_LIST
    }

    await taskDeterminants.save(determinants)

    return this.redirect({ h, route })
  }
}
