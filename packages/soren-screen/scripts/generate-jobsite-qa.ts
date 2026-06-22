/**
 * Generates src/adapters/jobsite/qa.generated.ts with 200 JobSite Intel Q&A pairs.
 * Run: pnpm exec tsx scripts/generate-jobsite-qa.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Pair { q: string; a: string; tags: string[] }

const scriptDir = dirname(fileURLToPath(import.meta.url));

function pairs(tag: string, items: [string, string][]): Pair[] {
  return items.map(([q, a]) => ({ q, a, tags: [tag] }));
}

const dailyLog = pairs('daily-log', [
  ['How do I create a daily log?', 'Tap New Log on the home screen, add photos, record a voice note, then tap Submit. Soren writes the report for you.'],
  ['Can I add photos after submitting?', 'Not after submitting — add all photos before you tap Submit. You can create a new log entry if needed.'],
  ['What happens if my voice note is too short?', 'Soren will still generate a report from your photos and any typed notes. Even a 3-second note is fine.'],
  ['How do I start today\'s field report?', 'Open Soren or Home, tap Daily Log, pick your project, then add photos and a voice note before Submit.'],
  ['Can I edit a log before submitting?', 'Yes — review everything on the capture screen and edit notes or retake photos before you submit.'],
  ['What project do I pick for a daily log?', 'Choose the active job from your project list. Soren remembers your last project for next time.'],
  ['Do I need internet to create a log?', 'You can capture offline; submit when you are back online so Soren can generate the report.'],
  ['How many photos can I add per log?', 'Add as many site photos as you need before submitting — there is no low limit for field documentation.'],
  ['Can I type instead of using voice?', 'Yes — type notes in the capture screen. Voice and typed notes both feed Soren\'s report.'],
  ['What time should I submit my daily log?', 'Submit before end of shift so weather and crew details stay accurate for the day.'],
  ['Can foremen log for the whole crew?', 'Each log reflects what you document. Note crew count and trades in your voice note or notes.'],
  ['How do I log weather on site?', 'Weather is pulled automatically from your project address when you submit — you do not enter it manually.'],
  ['Can I duplicate yesterday\'s log?', 'Start a new log for today; Soren uses fresh photos and notes rather than copying prior entries.'],
  ['What if I forget to log today?', 'Open Daily Log anytime and submit — backdating is not supported; log for the current work day.'],
  ['How do I add crew count to a log?', 'Say crew count in your voice note, e.g. "12 guys on site plus 2 inspectors."'],
  ['Can I log multiple projects in one day?', 'Create a separate daily log per project so reports stay organized per job.'],
  ['What fields are required on a log?', 'At minimum: project, photos or notes, and Submit. Voice is optional but recommended.'],
  ['How long does report generation take?', 'Usually under a minute after submit. You will get a push when the PDF is ready.'],
  ['Can I save a draft without submitting?', 'Stay on the capture screen until ready — submit when photos and notes are complete.'],
  ['Who sees my daily logs?', 'Your org team and anyone you share the report with. Clients only see what you send them.'],
]);

const reports = pairs('reports', [
  ['How do I download my PDF report?', 'After submitting a log, wait for Soren to finish, then tap Download Report on the result screen.'],
  ['Can I send the report to my client?', 'Yes — tap Share on any report to send via email, text, or any app on your phone.'],
  ['What is the Build Book closeout?', 'The Build Book is a complete project closeout document with all logs, photos, and a project summary. Generate it when you close a job.'],
  ['Where is my PDF stored?', 'Reports live in your project history. Download or share anytime from the log list.'],
  ['Can I print a daily report?', 'Download the PDF, then open it and use Print from your device share sheet.'],
  ['How do I share a report by email?', 'Tap Share on the report, choose Mail, and pick your client\'s address.'],
  ['What format are reports exported in?', 'PDF — ready for email, print, and client records.'],
  ['Can I regenerate a report?', 'Submit updates as a new log entry; each submission produces its own report.'],
  ['How do I find old reports?', 'Open the project, then Logs — browse by date.'],
  ['Does the report include photos?', 'Yes — photos you attached appear in the generated PDF.'],
  ['Can I brand reports with my company logo?', 'Org branding settings apply where configured in your account.'],
  ['What is in the executive summary?', 'Soren writes a concise summary of work, weather, crew, and issues from your capture.'],
  ['How do I export all logs for a project?', 'Use Build Book closeout for a full project package.'],
  ['Can clients view reports without the app?', 'Yes — shared PDF links and attachments work outside the app.'],
  ['Why is my report still processing?', 'Large photo sets can take longer. Wait for the ready notification.'],
  ['How do I rename a report?', 'Reports are titled by date and project — open the log detail to see the full title.'],
  ['Can I combine multiple days into one PDF?', 'Build Book closeout aggregates project logs for closeout documentation.'],
  ['What if PDF download fails?', 'Check connection and retry. If it persists, contact support from Settings.'],
  ['Are reports searchable?', 'Search within a project\'s log list by date or keywords in titles.'],
  ['How do I archive completed project reports?', 'Mark the project complete and generate Build Book for your records.'],
]);

const voice = pairs('voice', [
  ['How do voice notes work?', 'Tap the mic on the capture screen, speak naturally, and stop when done. Soren transcribes and uses it in your report.'],
  ['Can I speak in Spanish?', 'Yes — record in Spanish and Soren can produce bilingual English and Spanish report content.'],
  ['What if the mic does not work?', 'Check app microphone permission in iOS/Android settings, then retry.'],
  ['How long can a voice note be?', 'There is no strict short limit — keep it concise for faster processing.'],
  ['Can I re-record a voice note?', 'Yes — delete or replace the clip before submitting the log.'],
  ['Does Soren transcribe automatically?', 'Yes — transcription runs as part of report generation after submit.'],
  ['Can I edit the transcript?', 'Edit typed notes on the capture screen to correct anything before submit.'],
  ['Is voice required for every log?', 'No — photos plus typed notes are enough if you prefer not to use voice.'],
  ['How noisy can the job site be?', 'Speak clearly near the phone; extreme noise may reduce transcript quality.'],
  ['Can I use voice on Android?', 'Yes — voice capture works on iOS and Android in the Capacitor app.'],
  ['What language does Soren expect?', 'English and Spanish are supported for field voice notes.'],
  ['Why was my voice note empty?', 'Ensure mic permission is granted and you tapped stop after speaking.'],
  ['Can inspectors hear my voice notes?', 'Voice feeds the written report — clients typically receive the PDF, not raw audio.'],
  ['How do I test my microphone?', 'Record a short test on the capture screen before your real log.'],
  ['Does voice work offline?', 'You can record offline; upload and transcription happen when you submit online.'],
  ['Can I pause while recording?', 'Use stop and re-record if needed — one continuous clip per capture is simplest.'],
  ['Will Soren quote me verbatim?', 'Soren summarizes professionally — not always word-for-word from audio.'],
  ['Can I add voice after photos?', 'Yes — order does not matter before submit.'],
  ['Is voice data stored securely?', 'Audio is processed for your report under your org\'s data policies.'],
  ['How do I disable voice prompts?', 'Simply skip the mic and use typed notes instead.'],
]);

const photos = pairs('photos', [
  ['How do I add photos to a log?', 'Tap Add Photos on the capture screen and pick from camera or gallery.'],
  ['Can I add video?', 'Video support depends on your app version — check the capture screen for Add Video.'],
  ['What photo quality is best?', 'Use clear, well-lit shots of work in progress — no need for pro camera settings.'],
  ['How many photos per log?', 'Add as many as needed to document the day\'s work.'],
  ['Can I delete a photo before submit?', 'Yes — remove unwanted shots on the capture screen.'],
  ['Do photos upload on cellular?', 'Yes — photos upload when you submit if you are on mobile data.'],
  ['Why are photos blurry in the PDF?', 'Use original camera resolution; avoid heavy compression in gallery picks.'],
  ['Can I annotate photos?', 'Markup depends on host app features — document details in voice or notes too.'],
  ['Are GPS tags used?', 'Project address drives weather — photo GPS may be used where enabled.'],
  ['Can I reorder photos?', 'Reorder if the capture UI supports it; otherwise order in PDF follows upload order.'],
  ['What if upload stalls?', 'Check signal and retry submit. Large batches need stable connection.'],
  ['Can I photograph documents?', 'Yes — include delivery tickets, permits, or signs as needed.'],
  ['Do clients see all photos?', 'Clients see photos included in reports you share.'],
  ['How do I capture progress photos daily?', 'Make photos part of your daily log habit before submit.'],
  ['Can I use iPad camera?', 'Yes — JobSite Intel works on phones and tablets.'],
]);

const weather = pairs('weather', [
  ['Where does the weather come from?', 'Weather is automatically pulled from Open-Meteo based on your project address when you submit a log.'],
  ['Can I override weather?', 'Weather is auto-filled from the project location — edit notes if conditions differ on site.'],
  ['Why is weather wrong?', 'Verify the project address is correct in project settings.'],
  ['Does weather show rain amounts?', 'Reports include precip and conditions from Open-Meteo for the log date.'],
  ['Is weather in the PDF?', 'Yes — daily weather appears in the generated report.'],
  ['What if my site has no address yet?', 'Set a valid project address so weather can resolve.'],
  ['Does weather update hourly?', 'Snapshot is taken for your submission time and date.'],
  ['Can I see weather on the capture screen?', 'Weather preview may show on supported screens before submit.'],
  ['Is wind speed included?', 'Extended weather fields include wind and humidity where available.'],
  ['What weather source is used?', 'Open-Meteo — free global weather data for job sites.'],
]);

const projects = pairs('projects', [
  ['How do I create a project?', 'Go to Projects → New Project and enter the job name and address.'],
  ['How do I switch projects?', 'Pick the project from Home or the log capture flow.'],
  ['Can I close a completed job?', 'Use Build Book closeout when the job is finished.'],
  ['How many projects can I have?', 'Limits depend on your plan — free tier allows active projects per org policy.'],
  ['Who can see all projects?', 'Org members see projects their role permits.'],
  ['How do I edit a project address?', 'Open project settings and update the site address for weather and reports.'],
  ['Can I archive a project?', 'Mark complete and generate closeout documentation.'],
  ['What is an active project?', 'A job currently receiving daily logs.'],
  ['How do I invite someone to one project?', 'Team access is org-wide — manage members in Settings → Team.'],
  ['Can I duplicate a project?', 'Create a new project entry for a new job site.'],
  ['How do I name projects?', 'Use client and site name, e.g. "Santana Heights".'],
  ['What is project closeout?', 'Final documentation package via Build Book.'],
  ['Can I delete a project?', 'Owners can remove projects per org policy — check Settings.'],
  ['How do logs tie to projects?', 'Every log belongs to one project for organized history.'],
  ['Can I filter logs by project?', 'Open a project to see only its logs.'],
  ['How do I set a default project?', 'Soren remembers your last used project for quick logging.'],
  ['What if I pick wrong project?', 'Do not submit — switch project before submit, or create a correcting log.'],
  ['Are subcontractors per-project?', 'Document subs in daily log notes.'],
  ['How do I track multiple sites?', 'One project per site is recommended.'],
  ['Can PMs see all sites?', 'PM and superintendent roles see org projects per permissions.'],
]);

const buildBook = pairs('build-book', [
  ['What is Build Book?', 'A complete closeout PDF with all logs, photos, and summary for handoff.'],
  ['When should I generate Build Book?', 'When the job is substantially complete or at client handoff.'],
  ['How do I start closeout?', 'Open the project → Closeout or Build Book from the project menu.'],
  ['Does Build Book include weather history?', 'Yes — aggregated from daily logs across the project.'],
  ['Can I share Build Book with the owner?', 'Download or share the closeout PDF like any report.'],
  ['How long does closeout take?', 'Depends on log count — large projects may take a few minutes.'],
  ['Is Build Book different from daily PDF?', 'Yes — it is a full project archive, not a single day.'],
  ['Can I regenerate Build Book?', 'Run closeout again if you add late logs — check for updated export.'],
  ['What if closeout fails?', 'Ensure all logs are synced and retry. Contact support if needed.'],
  ['Does closeout need owner approval?', 'That is your workflow — the PDF is yours to deliver.'],
  ['Are change orders in Build Book?', 'Include change order notes in daily logs so they appear in history.'],
  ['Can I customize closeout cover?', 'Template follows construction-superintendent format in v1.'],
  ['Who can run closeout?', 'Users with project admin permissions.'],
  ['Is Build Book required?', 'Optional but recommended for professional handoff.'],
  ['What files are in closeout?', 'Typically one consolidated PDF plus summaries.'],
]);

const notifications = pairs('notifications', [
  ['How do push notifications work?', 'Enable notifications in device settings to get report-ready and reminder alerts.'],
  ['How do I enable push?', 'Allow notifications when prompted in the app.'],
  ['What is report-ready push?', 'You get notified when your PDF finishes generating.'],
  ['Can I turn off announcements?', 'Settings → Product announcements toggle controls marketing pushes.'],
  ['Do reminders use push or local?', 'Daily log reminders may use local notifications on device.'],
  ['Why am I not getting pushes?', 'Check OS notification permission and in-app settings.'],
  ['Can clients get pushes?', 'Clients receive reports you send — not app pushes unless they use the app.'],
  ['How do I notify a client from Soren?', 'Use Notify Client action or share a report from the log.'],
  ['Are pushes free?', 'Yes — notifications are part of the app.'],
  ['How do I unregister a device?', 'Log out or disable notifications in Settings.'],
]);

const account = pairs('account', [
  ['How do I add team members?', 'Go to Settings → Team to invite crew members by email.'],
  ['How do I change my password?', 'Settings → Account → change password or use forgot password on sign-in.'],
  ['Can I use this in Spanish?', 'Yes — record your voice note in Spanish and Soren will generate a bilingual report.'],
  ['How do I update my profile?', 'Settings → Profile for name and contact info.'],
  ['Can I have multiple orgs?', 'Switch org from Settings if you belong to more than one.'],
  ['How do I delete my account?', 'Contact support or use account deletion in Settings where available.'],
  ['Who is the org owner?', 'The owner manages billing and team in Settings.'],
  ['How do roles work?', 'Admin, member, and owner roles control team and project access.'],
  ['Can I change my email?', 'Update email in Settings → Account with verification.'],
  ['How do I sign out?', 'Settings → Sign out.'],
  ['Is two-factor available?', 'Check Settings → Security for MFA if enabled for your org.'],
  ['How do I contact support?', 'Settings → Help or support email in the app store listing.'],
  ['Can I export my data?', 'Request export from support for GDPR-style requests.'],
  ['How do I update the app?', 'Install updates from the App Store or Play Store.'],
  ['What devices are supported?', 'iOS and Android via the JobSite Intel app.'],
]);

const billing = pairs('billing', [
  ['How much does JobSite Intel cost?', 'JobSite Intel AI is free during the current period. Paid plans are coming soon.'],
  ['Is there a free trial?', 'The app is free to use during the current promotional period.'],
  ['Will pricing change?', 'We will announce paid plans before charges apply.'],
  ['Do I need a credit card?', 'Not during the free period for standard signup.'],
  ['Is billing per user or per org?', 'Future plans will be announced on the pricing page.'],
  ['Can I cancel anytime?', 'During free period there is nothing to cancel.'],
  ['Are there enterprise plans?', 'Contact sales for multi-org enterprise needs.'],
  ['Do clients pay?', 'Billing is for contractors using the app, not homeowners.'],
  ['What happens when free period ends?', 'You will receive notice and upgrade options before any charge.'],
  ['Where is the pricing page?', 'Check jobsiteintel.com or in-app Settings → Billing when live.'],
]);

const outOfScope = pairs('out-of-scope', [
  ['What\'s the weather today?', 'I only know construction — for today\'s forecast, check your weather app. I\'ll pull weather for your job site when you log.'],
  ['Who won the game last night?', 'That\'s outside what I know today. We\'re always adding more.'],
  ['Write me a poem.', 'I focus on construction field work — try Daily Log or Ask Soren about JobSite Intel.'],
  ['What is the stock market doing?', 'I only help with JobSite Intel — logs, reports, and projects.'],
  ['Order me lunch.', 'I can\'t do that — but I can help you document today\'s site work.'],
  ['What is the meaning of life?', 'On the job site: document, communicate, and close out strong. Ask me about daily logs!'],
  ['Tell me a joke.', 'I\'m better at daily reports than comedy — ask about voice notes or PDFs.'],
  ['How do I fix my truck?', 'That\'s outside what I know today. We\'re always adding more.'],
  ['What movie should I watch?', 'I only know construction — try Ask Soren about portfolio or reports.'],
  ['Book me a flight.', 'I help with JobSite Intel only — projects, logs, and client updates.'],
  ['What is quantum physics?', 'Outside my scope — ask about Build Book or team settings instead.'],
  ['Play music.', 'I\'m your field assistant for documentation, not a music player.'],
  ['What is two plus two?', 'That\'s outside what I know today. We\'re always adding more.'],
  ['Who is the president?', 'I focus on JobSite Intel features — try a product question.'],
  ['Translate this to French.', 'I support English and Spanish for reports — not general translation.'],
]);

const spanish = pairs('spanish', [
  ['Can I log in Spanish?', 'Yes — record voice in Spanish; Soren can produce bilingual reports.'],
  ['Does the app UI speak Spanish?', 'UI language depends on device settings; reports can be bilingual.'],
  ['How do bilingual reports work?', 'Soren generates English and Spanish content from your Spanish voice note.'],
  ['Can clients read Spanish reports?', 'Share the bilingual PDF — both languages can be included.'],
  ['Do I type in Spanish?', 'Yes — typed Spanish notes work like voice.'],
  ['Is Spanish transcription accurate?', 'Speak clearly; quality matches general Spanish field speech.'],
  ['Can supers only use English?', 'Use whichever language fits your crew — both are supported.'],
  ['Are templates in Spanish?', 'Report narrative can include Spanish per bilingual setting.'],
  ['How do I switch report language?', 'Record in Spanish for bilingual output; settings may expand later.'],
  ['Is support available in Spanish?', 'Contact support — we help all JobSite Intel users.'],
]);

const sorenAi = pairs('soren-ai', [
  ['Who is Soren?', 'Soren is your AI field assistant inside JobSite Intel — logs, reports, and answers.'],
  ['What can Soren do?', 'Help you log work, generate reports, build portfolio, and answer JobSite questions.'],
  ['Is Soren a real person?', 'Soren is AI built by Varshyl to help supers and foremen in the field.'],
  ['Does Soren use ChatGPT?', 'Soren uses Varshyl\'s AI stack — optimized for construction daily reports.'],
  ['How smart is Soren?', 'Soren is trained for JobSite workflows — not general trivia.'],
  ['Can Soren schedule my crew?', 'Not yet — use daily logs and team settings for crew documentation.'],
  ['Does Soren replace a PM?', 'No — Soren assists documentation; you stay in charge of the job.'],
  ['How do I ask Soren questions?', 'Tap Ask Soren or type in the input bar on the Soren screen.'],
  ['Will Soren learn my projects?', 'Soren uses your org\'s logs and settings — not open internet search.'],
  ['Is my data used to train AI?', 'See privacy policy — your org controls data handling.'],
  ['Can Soren email my client?', 'Use Notify Client or Share report — Soren drafts from your logs.'],
  ['What is Soren\'s avatar?', 'The construction assistant emoji on the Soren screen.'],
  ['How do I reset Soren identity?', 'Clear Soren session in app storage or re-enter name on first open.'],
  ['Does Soren work on web?', 'Yes — Soren screen works in browser and Capacitor app.'],
  ['Can I turn off Soren?', 'Use Home and logs without opening Soren — it is optional help.'],
  ['Does Soren support voice on Soren screen?', 'Tap the mic on the input row to ask by voice where enabled.'],
  ['How often is Soren updated?', 'Q&A and skills expand with each app release.'],
  ['Can Soren build my resume?', 'Yes — tap My Portfolio for PDF and share options.'],
  ['What is portfolio builder?', 'Soren summarizes your logs into a superintendent portfolio.'],
  ['Is Soren available offline?', 'Some features need network — capture can work offline before submit.'],
]);

const all = [
  ...dailyLog,
  ...reports,
  ...voice,
  ...photos,
  ...weather,
  ...projects,
  ...buildBook,
  ...notifications,
  ...account,
  ...billing,
  ...outOfScope,
  ...spanish,
  ...sorenAi,
];

if (all.length !== 200) {
  throw new Error(`Expected 200 Q&A pairs, got ${all.length}`);
}

const out = `// AUTO-GENERATED by scripts/generate-jobsite-qa.ts — do not edit manually.

import type { SorenQAPair } from '../../types.js';

export const JOBSITE_QA: SorenQAPair[] = ${JSON.stringify(all, null, 2)} as SorenQAPair[];
`;

const outFile = join(scriptDir, '../src/adapters/jobsite/qa.generated.ts');
writeFileSync(outFile, out, 'utf8');
console.log(`[soren-screen] generated ${all.length} JobSite Q&A pairs → ${outFile}`);
