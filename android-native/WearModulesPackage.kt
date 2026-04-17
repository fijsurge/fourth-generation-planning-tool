package com.fourthgenplanner.app

import expo.modules.kotlin.BasePackage

class WearModulesPackage : BasePackage() {
    override fun createModules() = listOf(WearDataModule())
}
