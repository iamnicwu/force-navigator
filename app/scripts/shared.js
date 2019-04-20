var getServerInstance = ()=>{
	let targetUrl
	let url = location.origin + ""
	if(url.indexOf("lightning.force") != -1)
		targetUrl = url.substring(0, url.indexOf("lightning.force")) + "lightning.force.com"
	else if(url.indexOf("salesforce") != -1)
		targetUrl = url.substring(0, url.indexOf("salesforce")) + "salesforce.com"
	else if(url.indexOf("cloudforce") != -1)
		targetUrl = url.substring(0, url.indexOf("cloudforce")) + "cloudforce.com"
	else if(url.indexOf("visual.force") != -1) {
		let urlParseArray = url.split(".")
		targetUrl = 'https://' + urlParseArray[1] + ''
	}
	return targetUrl
}
var getSessionHash = ()=>{
	try {
		let sId = document.cookie.match(regMatchSid)[1]
		return sId.split('!')[0] + '!' + sId.substring(sId.length - 10, sId.length)
	} catch(e) { if(debug) console.log(e) }
}
let getHTTP = function(targetUrl, type = "json", headers = {}, data = {}, method = "GET") {
	let request = { method: method, headers: headers }
	if(Object.keys(data).length > 0)
		request.body = JSON.stringify(data)
	return fetch(targetUrl, request).then(response => {
		apiUrl = response.url.match(/:\/\/(.*)salesforce.com/)[1] + "salesforce.com"
		switch(type) {
			case "json": return response.clone().json()
			case "document": return response.clone().text()
		}
	}).then(data => {
		if(typeof data == "string")
			return (new DOMParser()).parseFromString(data, "text/html")
		else
			return data
	})
}


const debug = false
const newTabKeys = [ "ctrl+enter", "command+enter", "shift+enter" ]
const regMatchSid = /sid=([a-zA-Z0-9\.\!]+)/
const SFAPI_VERSION = 'v40.0'
const classicToLightingMap = {
	'Fields': "/FieldsAndRelationships/view",
	'Page Layouts': '/PageLayouts/view',
	'Buttons, Links, and Actions': '/ButtonsLinksActions/view',
	'Compact Layouts': '/CompactLayouts/view',
	'Field Sets': '/FieldSets/view',
	'Limits': '/Limits/view',
	'Record Types': '/RecordTypes/view',
	'Related Lookup Filters': '/RelatedLookupFilters/view',
	'Search Layouts': '/SearchLayouts/view',
	'Triggers': '/Triggers/view',
	'Validation Rules': '/ValidationRules/view'
}
const setupLabelsToLightningMap = {
	"Setup Home": "/lightning/setup/SetupOneHome/home",
	"Lightning Experience Transition Assistant": "/lightning/setup/EnableLightningExperience/home",
	"Lightning Usage": "/lightning/setup/LightningUsageSetup/home",
	"Permission Sets": "/lightning/setup/PermSets/home",
	"Profiles": "/lightning/setup/Profiles/home",
	"Public Groups": "/lightning/setup/PublicGroups/home",
	"Queues": "/lightning/setup/Queues/home",
	"Roles": "/lightning/setup/Roles/home",
	"User Management Settings": "/lightning/setup/UserManagementSettings/home",
	"Users": "/lightning/setup/ManageUsers/home",
	"Big Objects": "/lightning/setup/BigObjects/home",
	"Data Export": "/lightning/setup/DataManagementExport/home",
	"Data Integration Metrics": "/lightning/setup/XCleanVitalsUi/home",
	"Data Integration Rules": "/lightning/setup/CleanRules/home",
	"Duplicate Error Logs": "/lightning/setup/DuplicateErrorLog/home",
	"Duplicate Rules": "/lightning/setup/DuplicateRules/home",
	"Matching Rules": "/lightning/setup/MatchingRules/home",
	"Mass Delete Records": "/lightning/setup/DataManagementDelete/home",
	"Mass Transfer Approval Requests": "/lightning/setup/DataManagementManageApprovals/home",
	"Mass Transfer Records": "/lightning/setup/DataManagementTransfer/home",
	"Mass Update Addresses": "/lightning/setup/DataManagementMassUpdateAddresses/home",
	"Picklist Settings": "/lightning/setup/PicklistSettings/home",
	"Schema Settings": "/lightning/setup/SchemaSettings/home",
	"State and Country/Territory Picklists": "/lightning/setup/AddressCleanerOverview/home",
	"Storage Usage": "/lightning/setup/CompanyResourceDisk/home",
	"Apex Exception Email": "/lightning/setup/ApexExceptionEmail/home",
	"Classic Email Templates": "/lightning/setup/CommunicationTemplatesEmail/home",
	"Compliance BCC Email": "/lightning/setup/SecurityComplianceBcc/home",
	"DKIM Keys": "/lightning/setup/EmailDKIMList/home",
	"Deliverability": "/lightning/setup/OrgEmailSettings/home",
	"Email Attachments": "/lightning/setup/EmailAttachmentSettings/home",
	"Email Footers": "/lightning/setup/EmailDisclaimers/home",
	"Email to Salesforce": "/lightning/setup/EmailToSalesforce/home",
	"Enhanced Email": "/lightning/setup/EnhancedEmail/home",
	"Gmail Integration and Sync": "/lightning/setup/LightningForGmailAndSyncSettings/home",
	"Letterheads": "/lightning/setup/CommunicationTemplatesLetterheads/home",
	"Lightning Email Templates": "/lightning/setup/LightningEmailTemplateSetup/home",
	"Mail Merge Templates": "/lightning/setup/CommunicationTemplatesWord/home",
	"Organization-Wide Addresses": "/lightning/setup/OrgWideEmailAddresses/home",
	"Outlook Configurations": "/lightning/setup/EmailConfigurations/home",
	"Outlook Integration and Sync": "/lightning/setup/LightningForOutlookAndSyncSettings/home",
	"Send through External Email Services": "/lightning/setup/EmailTransportServiceSetupPage/home",
	"Test Deliverability": "/lightning/setup/TestEmailDeliverability/home",
	"App Manager": "/lightning/setup/NavigationMenus/home",
	"AppExchange Marketplace": "/lightning/setup/AppExchangeMarketplace/home",
	"Connected Apps OAuth Usage": "/lightning/setup/ConnectedAppsUsage/home",
	"Manage Connected Apps": "/lightning/setup/ConnectedApplication/home",
	"Installed Packages": "/lightning/setup/ImportedPackage/home",
	"Flow Category": "/lightning/setup/FlowCategory/home",
	"Lightning Bolt Solutions": "/lightning/setup/LightningBolt/home",
	"Salesforce Branding": "/lightning/setup/Salesforce1Branding/home",
	"Salesforce Mobile Quick Start": "/lightning/setup/Salesforce1SetupSection/home",
	"Salesforce Navigation": "/lightning/setup/ProjectOneAppMenu/home",
	"Salesforce Notifications": "/lightning/setup/NotificationsSettings/home",
	"Salesforce Offline": "/lightning/setup/MobileOfflineStorageAdmin/home",
	"Salesforce Settings": "/lightning/setup/Salesforce1Settings/home",
	"Package Manager": "/lightning/setup/Package/home",
	"Communities Settings": "/lightning/setup/SparkSetupPage/home",
	"Home": "/lightning/setup/Home/home",
	"Office 365": "/lightning/setup/NetworkSettings/home",
	"Skype for Salesforce": "/lightning/setup/SkypeSetupPage/home",
	"Quip": "/lightning/setup/QuipSetupAssistant/home",
	"Asset Files": "/lightning/setup/ContentAssets/home",
	"Content Deliveries and Public Links": "/lightning/setup/ContentDistribution/home",
	"Files Connect": "/lightning/setup/ContentHub/home",
	"General Settings": "/lightning/setup/FilesGeneralSettings/home",
	"Regenerate Previews": "/lightning/setup/RegeneratePreviews/home",
	"Salesforce CRM Content": "/lightning/setup/SalesforceCRMContent/home",
	"Synonyms": "/lightning/setup/ManageSynonyms/home",
	"Case Assignment Rules": "/lightning/setup/CaseRules/home",
	"Case Auto-Response Rules": "/lightning/setup/CaseResponses/home",
	"Case Comment Triggers": "/lightning/setup/CaseCommentTriggers/home",
	"Case Team Roles": "/lightning/setup/CaseTeamRoles/home",
	"Predefined Case Teams": "/lightning/setup/CaseTeamTemplates/home",
	"Contact Roles on Cases": "/lightning/setup/CaseContactRoles/home",
	"Customer Contact Requests": "/lightning/setup/ContactRequestFlows/home",
	"Email-to-Case": "/lightning/setup/EmailToCase/home",
	"Escalation Rules": "/lightning/setup/CaseEscRules/home",
	"Feed Filters": "/lightning/setup/FeedFilterDefinitions/home",
	"Field Service Settings": "/lightning/setup/FieldServiceSettings/home",
	"Macro Settings": "/lightning/setup/MacroSettings/home",
	"Omni-Channel Settings": "/lightning/setup/OmniChannelSettings/home",
	"Snap-ins": "/lightning/setup/Snap-ins/home",
	"Social Business Rules": "/lightning/setup/SocialCustomerServiceBusinessRules/home",
	"Social Customer Service": "/lightning/setup/SocialCustomerManagementAccountSettings/home",
	"Support Processes": "/lightning/setup/CaseProcess/home",
	"Support Settings": "/lightning/setup/CaseSettings/home",
	"Web-to-Case": "/lightning/setup/CaseWebtocase/home",
	"Web-to-Case HTML Generator": "/lightning/setup/CaseWebToCaseHtmlGenerator/home",
	"Survey Settings": "/lightning/setup/SurveySettings/home",
	"Object Manager": "/lightning/setup/ObjectManager/home",
	"Picklist Value Sets": "/lightning/setup/Picklists/home",
	"Schema Builder": "/lightning/setup/SchemaBuilder/home",
	"Approval Processes": "/lightning/setup/ApprovalProcesses/home",
	"Flows": "/lightning/setup/InteractionProcesses/home",
	"Next Best Action": "/lightning/setup/NextBestAction/home",
	"Post Templates": "/lightning/setup/FeedTemplates/home",
	"Process Automation Settings": "/lightning/setup/WorkflowSettings/home",
	"Process Builder": "/lightning/setup/ProcessAutomation/home",
	"Email Alerts": "/lightning/setup/WorkflowEmails/home",
	"Field Updates": "/lightning/setup/WorkflowFieldUpdates/home",
	"Outbound Messages": "/lightning/setup/WorkflowOutboundMessaging/home",
	"Send Actions": "/lightning/setup/SendAction/home",
	"Tasks": "/lightning/setup/WorkflowTasks/home",
	"Workflow Rules": "/lightning/setup/WorkflowRules/home",
	"Action Link Templates": "/lightning/setup/ActionLinkGroupTemplates/home",
	"App Menu": "/lightning/setup/AppMenu/home",
	"Custom Labels": "/lightning/setup/ExternalStrings/home",
	"Density Settings": "/lightning/setup/DensitySetup/home",
	"Global Actions": "/lightning/setup/GlobalActions/home",
	"Publisher Layouts": "/lightning/setup/GlobalPublisherLayouts/home",
	"Guided Actions": "/lightning/setup/GuidedActions/home",
	"Lightning App Builder": "/lightning/setup/FlexiPageList/home",
	"Path Settings": "/lightning/setup/PathAssistantSetupHome/home",
	"Quick Text Settings": "/lightning/setup/LightningQuickTextSettings/home",
	"Rename Tabs and Labels": "/lightning/setup/RenameTab/home",
	"Custom URLs": "/lightning/setup/DomainSites/home",
	"Domains": "/lightning/setup/DomainNames/home",
	"Sites": "/lightning/setup/CustomDomain/home",
	"Tabs": "/lightning/setup/CustomTabs/home",
	"Themes and Branding": "/lightning/setup/ThemingAndBranding/home",
	"Export": "/lightning/setup/LabelWorkbenchExport/home",
	"Import": "/lightning/setup/LabelWorkbenchImport/home",
	"Override": "/lightning/setup/LabelWorkbenchOverride/home",
	"Translate": "/lightning/setup/LabelWorkbenchTranslate/home",
	"Translation Settings": "/lightning/setup/LabelWorkbenchSetup/home",
	"User Interface": "/lightning/setup/UserInterfaceUI/home",
	"Apex Classes": "/lightning/setup/ApexClasses/home",
	"Apex Hammer Test Results": "/lightning/setup/ApexHammerResultStatus/home",
	"Apex Settings": "/lightning/setup/ApexSettings/home",
	"Apex Test Execution": "/lightning/setup/ApexTestQueue/home",
	"Apex Test History": "/lightning/setup/ApexTestHistory/home",
	"Apex Triggers": "/lightning/setup/ApexTriggers/home",
	"Canvas App Previewer": "/lightning/setup/CanvasPreviewerUi/home",
	"Custom Metadata Types": "/lightning/setup/CustomMetadata/home",
	"Custom Permissions": "/lightning/setup/CustomPermissions/home",
	"Custom Settings": "/lightning/setup/CustomSettings/home",
	"Email Services": "/lightning/setup/EmailToApexFunction/home",
	"Debug Mode": "/lightning/setup/UserDebugModeSetup/home",
	"Lightning Components": "/lightning/setup/LightningComponentBundles/home",
	"Platform Cache": "/lightning/setup/PlatformCache/home",
	"Remote Access": "/lightning/setup/RemoteAccess/home",
	"Static Resources": "/lightning/setup/StaticResources/home",
	"Tools": "/lightning/setup/ClientDevTools/home",
	"Visualforce Components": "/lightning/setup/ApexComponents/home",
	"Visualforce Pages": "/lightning/setup/ApexPages/home",
	"Dev Hub": "/lightning/setup/DevHub/home",
	"Inbound Change Sets": "/lightning/setup/InboundChangeSet/home",
	"Outbound Change Sets": "/lightning/setup/OutboundChangeSet/home",
	"Deployment Settings": "/lightning/setup/DeploymentSettings/home",
	"Deployment Status": "/lightning/setup/DeployStatus/home",
	"Apex Flex Queue": "/lightning/setup/ApexFlexQueue/home",
	"Apex Jobs": "/lightning/setup/AsyncApexJobs/home",
	"Background Jobs": "/lightning/setup/ParallelJobsStatus/home",
	"Bulk Data Load Jobs": "/lightning/setup/AsyncApiJobStatus/home",
	"Scheduled Jobs": "/lightning/setup/ScheduledJobs/home",
	"Debug Logs": "/lightning/setup/ApexDebugLogs/home",
	"Email Log Files": "/lightning/setup/EmailLogFiles/home",
	"API Usage Notifications": "/lightning/setup/MonitoringRateLimitingNotification/home",
	"Case Escalations": "/lightning/setup/DataManagementManageCaseEscalation/home",
	"Email Snapshots": "/lightning/setup/EmailCapture/home",
	"Outbound Messages": "/lightning/setup/WorkflowOmStatus/home",
	"Time-Based Workflow": "/lightning/setup/DataManagementManageWorkflowQueue/home",
	"Sandboxes": "/lightning/setup/DataManagementCreateTestInstance/home",
	"System Overview": "/lightning/setup/SystemOverview/home",
	"Adoption Assistance": "/lightning/setup/AdoptionAssistance/home",
	"Help Menu": "/lightning/setup/HelpMenu/home",
	"API": "/lightning/setup/WebServices/home",
	"Change Data Capture": "/lightning/setup/CdcObjectEnablement/home",
	"Data Import Wizard": "/lightning/setup/DataManagementDataImporter/home",
	"Data Loader": "/lightning/setup/DataLoader/home",
	"Dataloader.io": "/lightning/setup/DataLoaderIo/home",
	"External Data Sources": "/lightning/setup/ExternalDataSource/home",
	"External Objects": "/lightning/setup/ExternalObjects/home",
	"External Services": "/lightning/setup/ExternalServices/home",
	"Platform Events": "/lightning/setup/EventObjects/home",
	"Business Hours": "/lightning/setup/BusinessHours/home",
	"Public Calendars and Resources": "/lightning/setup/Calendars/home",
	"Company Information": "/lightning/setup/CompanyProfileInfo/home",
	"Critical Updates": "/lightning/setup/CriticalUpdates/home",
	"Data Protection and Privacy": "/lightning/setup/ConsentManagement/home",
	"Fiscal Year": "/lightning/setup/ForecastFiscalYear/home",
	"Holidays": "/lightning/setup/Holiday/home",
	"Language Settings": "/lightning/setup/LanguageSettings/home",
	"Maps and Location Settings": "/lightning/setup/MapsAndLocationServicesSettings/home",
	"My Domain": "/lightning/setup/OrgDomain/home",
	"Data Classification (Beta)": "/lightning/setup/DataClassificationSettings/home",
	"Data Classification Download": "/lightning/setup/DataClassificationDownload/home",
	"Data Classification Upload": "/lightning/setup/DataClassificationUpload/home",
	"Auth. Providers": "/lightning/setup/AuthProviders/home",
	"Identity Provider": "/lightning/setup/IdpPage/home",
	"Identity Provider Event Log": "/lightning/setup/IdpErrorLog/home",
	"Identity Verification": "/lightning/setup/IdentityVerification/home",
	"Identity Verification History": "/lightning/setup/VerificationHistory/home",
	"Login Flows": "/lightning/setup/LoginFlow/home",
	"Login History": "/lightning/setup/OrgLoginHistory/home",
	"Single Sign-On Settings": "/lightning/setup/SingleSignOn/home",
	"Activations": "/lightning/setup/ActivatedIpAddressAndClientBrowsersPage/home",
	"CORS": "/lightning/setup/CorsWhitelistEntries/home",
	"CSP Trusted Sites": "/lightning/setup/SecurityCspTrustedSite/home",
	"Certificate and Key Management": "/lightning/setup/CertificatesAndKeysManagement/home",
	"Delegated Administration": "/lightning/setup/DelegateGroups/home",
	"Event Monitoring Settings": "/lightning/setup/EventMonitoringSetup/home",
	"Expire All Passwords": "/lightning/setup/SecurityExpirePasswords/home",
	"Field Accessibility": "/lightning/setup/FieldAccessibility/home",
	"File Upload and Download Security": "/lightning/setup/FileTypeSetting/home",
	"Health Check": "/lightning/setup/HealthCheck/home",
	"Login Access Policies": "/lightning/setup/LoginAccessPolicies/home",
	"Named Credentials": "/lightning/setup/NamedCredential/home",
	"Network Access": "/lightning/setup/NetworkAccess/home",
	"Password Policies": "/lightning/setup/SecurityPolicies/home",
	"Remote Site Settings": "/lightning/setup/SecurityRemoteProxy/home",
	"Session Management": "/lightning/setup/SessionManagementPage/home",
	"Session Settings": "/lightning/setup/SecuritySession/home",
	"Sharing Settings": "/lightning/setup/SecuritySharing/home",
	"View Setup Audit Trail": "/lightning/setup/SecurityEvents/home",
	"Optimizer": "/lightning/setup/SalesforceOptimizer/home",
	"Task Fields": "/lightning/setup/ObjectManager/Task/FieldsAndRelationships/view",
	"Activity Custom Fields": "/lightning/setup/ObjectManager/Task/FieldsAndRelationships/view",
	"Task Page Layouts": "/lightning/setup/ObjectManager/Task/PageLayouts/view",
	"Task Buttons, Links, and Actions": "/lightning/setup/ObjectManager/Task/ButtonsLinksActions/view",
	"Task Compact Layouts": "/lightning/setup/ObjectManager/Task/CompactLayouts/view",
	"Task Field Sets": "/lightning/setup/ObjectManager/Task/FieldSets/view",
	"Task Limits": "/lightning/setup/ObjectManager/Task/Limits/view",
	"Task Record Types": "/lightning/setup/ObjectManager/Task/RecordTypes/view",
	"Task Related Lookup Filters": "/lightning/setup/ObjectManager/Task/RelatedLookupFilters/view",
	"Task Search Layouts": "/lightning/setup/ObjectManager/Task/SearchLayouts/view",
	"Task Triggers": "/lightning/setup/ObjectManager/Task/Triggers/view",
	"Task Validation Rules": "/lightning/setup/ObjectManager/Task/ValidationRules/view",
	"Event Fields": "/lightning/setup/ObjectManager/Event/FieldsAndRelationships/view",
	"Event Page Layouts": "/lightning/setup/ObjectManager/Event/PageLayouts/view",
	"Event Buttons, Links, and Actions": "/lightning/setup/ObjectManager/Event/ButtonsLinksActions/view",
	"Event Compact Layouts": "/lightning/setup/ObjectManager/Event/CompactLayouts/view",
	"Event Field Sets": "/lightning/setup/ObjectManager/Event/FieldSets/view",
	"Event Limits": "/lightning/setup/ObjectManager/Event/Limits/view",
	"Event Record Types": "/lightning/setup/ObjectManager/Event/RecordTypes/view",
	"Event Related Lookup Filters": "/lightning/setup/ObjectManager/Event/RelatedLookupFilters/view",
	"Event Search Layouts": "/lightning/setup/ObjectManager/Event/SearchLayouts/view",
	"Event Triggers": "/lightning/setup/ObjectManager/Event/Triggers/view",
	"Event Validation Rules": "/lightning/setup/ObjectManager/Event/ValidationRules/view"
}