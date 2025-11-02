/**
 * View.js
 *
 * (C) 2025 by Eylem Ugurel
 *
 * Licensed under a Creative Commons Attribution 4.0 International License.
 *
 * You should have received a copy of the license along with this work. If not,
 * see <http://creativecommons.org/licenses/by/4.0/>.
 */

class View extends App.View
{
    constructor()
    {
        super();
        this.set('databaseInstallStep',
            new InstallStep('install-step-database'));
        this.set('accountTableInstallStep',
            new InstallStep('install-step-table-account'));
        this.set('accountRoleTableInstallStep',
            new InstallStep('install-step-table-accountrole'));
        this.set('accountViewTableInstallStep',
            new InstallStep('install-step-table-accountview'));
        this.set('pendingAccountTableInstallStep',
            new InstallStep('install-step-table-pendingaccount'));
        this.set('passwordResetTableInstallStep',
            new InstallStep('install-step-table-passwordreset'));
        this.set('persistentLoginTableInstallStep',
            new InstallStep('install-step-table-persistentlogin'));
        this.set('adminAccountInstallStep',
            new InstallStep('install-step-admin-account'));
        this.set('installSummary', '#install-summary');
    }
}
