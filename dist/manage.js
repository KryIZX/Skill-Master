import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkbox, select, confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Token map extracted from the user's IDE Customizations screenshot
const TOKEN_MAP = {
    'viral-reverse-engineering': 367, 'crisis-response-planner': 365, 'scripting-and-storyboarding': 365,
    'narrative-cascade-planner': 363, 'social-selling-planner': 363, 'idea-generation-and-ideation': 362,
    'short-form-video-script': 358, 'experimentation-and-ab-testing': 357, 'instagram-reels-publishing': 354,
    'thumbnail-design': 352, 'narrative-resonance-monitor': 351, 'content-calendar': 350,
    'instagram-seo': 350, 'reels-script': 349, 'design-taste-frontend': 346,
    'social-creative-builder': 346, 'analytics-and-reporting': 344, 'platform-norm-profiler': 344,
    'narrative-drift-monitor': 342, 'trend-jacking': 342, 'community-launch-runner': 341,
    'reactivation-specialist': 339, 'launch-asset-packager': 338, 'engagement-inbox-manager': 337,
    'social-calendar-builder': 335, 'pitch-narrative-builder': 334, 'page-play-builder': 330,
    'short-video-scripter': 327, 'facebook-strategy': 322, 'social-pulse-monitor': 322,
    'social-strategy': 321, 'narrative-enablement-kit': 319, 'voice-dossier-builder': 319,
    'content-amplifier': 318, 'instagram-growth': 318, 'message-test-designer': 314,
    'positioning-mapper': 311, 'proof-point-packager': 310, 'dark-social-attributor': 309,
    'list-hygiene-monitor': 309, 'youtube-publishing-and-metadata': 306, 'strategic-narrative-designer': 305,
    'brand-language-codifier': 304, 'launch-day-conductor': 303, 'launch-retro-analyzer': 302,
    'audience-belief-mapper': 301, 'email-sequence-designer': 301, 'ponytail': 301,
    'advocacy-program-designer': 296, 'participation-warmup-planner': 296, 'social-measurement-loop': 296,
    'deliverability-qa': 295, 'message-house-builder': 294, 'conversion-value-mapper': 291,
    'story-writer': 290, 'category-narrative-mapper': 289, 'share-of-voice-tracker': 289,
    'thread-writer': 289, 'launch-tier-planner': 288, 'message-system-architect': 286,
    'audience-research': 284, 'sales-enablement-kit': 283, 'carousel-writer': 281,
    'launch-monitor': 281, 'preference-frequency-manager': 281, 'pricing-packaging-planner': 281,
    'content-recycling': 278, 'early-access-designer': 278, 'content-pillars': 278,
    'cross-platform-repurposing': 272, 'hook-writer': 272, 'narrative-baseline-mapper': 272,
    'list-growth-designer': 267, 'inbox-placement-monitor': 265, 'momentum-planner': 265,
    'story-bank-builder': 264, 'subject-line-lab': 262, 'caption-writer': 261,
    'x-growth': 260, 'audience-mapper': 257, 'dynamic-content-personalizer': 257,
    'launch-feedback-synthesizer': 254, 'press-media-relations': 254, 'positioning-truth-tracer': 253,
    'cold-outbound-sequencer': 252, 'imagegen-frontend-web': 250, 'attribution-reconciler': 248,
    'launch-window-planner': 247, 'list-segment-builder': 247, 'imagegen-frontend-mobile': 244,
    'audience-segment-builder': 243, 'placement-exclusion-manager': 242, 'product-feed-optimizer': 239,
    'outreach-manager': 238, 'elite-remotion': 237, 'offsite-signal-analyzer': 236,
    'conversion-signal-qa': 235, 'email-creative-builder': 235, 'site-structure-optimizer': 231,
    'ad-test-designer': 230, 'campaign-architect': 227, 'send-experiment-designer': 225,
    'campaign-planner': 223, 'newsletter-monetization-planner': 222, 'search-term-miner': 220,
    'impeccable': 218, 'image-to-code': 211, 'paid-measurement-loop': 207,
    'creator-content-auditor': 201, 'landing-experience-checker': 201, 'youtube-long-form': 198,
    'bid-strategy-planner': 197, 'budget-pacing-monitor': 197, 'channel-portfolio-planner': 192,
    'content-writer': 191, 'whop-dev': 191, 'fatigue-frequency-manager': 190,
    'serp-markup-builder': 190, 'email-render-builder': 189, 'trend-spotter': 183,
    'ponytail-review': 177, 'narrative-quality-auditor': 176, 'android-device-hub': 175,
    'brandkit': 175, 'fit-scorer': 174, 'design-taste-frontend-v2-experimental': 173,
    'performance-monitor': 173, 'youtube-shorts': 171, 'social-quality-auditor': 170,
    'ad-creative-builder': 169, 'android-cli': 169, 'contract-helper': 165,
    'landing-optimizer': 165, 'launch-registry': 165, 'entity-registry': 163,
    'offer-claims-registry': 163, 'narrative-registry': 162, 'consent-registry': 161,
    'performance-analyzer': 161, 'memory-management': 159, 'ponytail-audit': 158,
    'ad-account-auditor': 155, 'launch-readiness-auditor': 154, 'channel-registry': 153,
    'competitor-tracker': 153, 'ponytail-debt': 153, 'email-quality-auditor': 152,
    'influencer-discovery': 152, 'compose-preview': 150, 'creator-registry': 146,
    'budget-optimizer': 145, 'on-page-seo-checker': 144, 'report-generator': 144,
    'domain-authority-auditor': 143, 'graphify': 139, 'whop': 138,
    'roi-calculator': 135, 'brief-generator': 134, 'content-quality-auditor': 133,
    'reverse-engineer-anything': 132, 'gpt-taste': 127, 'rank-tracker': 127,
    'competitor-analysis': 125, 'content-gap-analysis': 125, 'ponytail-gain': 125,
    'industrial-brutalist-ui': 123, 'geo-content-optimizer': 122, 'agentpay': 119,
    'keyword-research': 117, 'stitch-design-taste': 112, 'serp-analysis': 108,
    'technical-seo-checker': 108, 'design-taste-frontend-v1': 105, 'high-end-visual-design': 104,
    'redesign-existing-projects': 104, 'ponytail-update': 101, 'full-output-enforcement': 95,
    'ponytail-help': 91, 'antigravity-design-expert': 74, 'minimalist-ui': 73,
};
export class SkillManager {
    skills = [];
    markedIds = new Set();
    inventoryPath;
    constructor() {
        this.inventoryPath = path.resolve(__dirname, 'INVENTORY.json');
        this.loadSkills();
        this.loadSavedMarks();
    }
    loadSkills() {
        if (!fs.existsSync(this.inventoryPath)) {
            throw new Error(`INVENTORY.json not found at ${this.inventoryPath}`);
        }
        const raw = JSON.parse(fs.readFileSync(this.inventoryPath, 'utf-8'));
        this.skills = raw.skills.map((s) => ({
            id: s.item_id,
            name: s.name,
            declaredName: s.declared_name || s.name,
            screenshotStatus: s.screenshot_status || 'Active',
            scope: s.scope || 'Global Antigravity',
            origAbsPath: s.orig_abs_path || '',
            backupRepoPath: s.backup_repo_path || '',
            filesCount: s.files_count || 1,
            tokens: TOKEN_MAP[s.name] || 0,
            description: s.description || '',
        }));
    }
    loadSavedMarks() {
        const saveFile = path.resolve(__dirname, 'marked_for_deletion.json');
        if (fs.existsSync(saveFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(saveFile, 'utf-8'));
                if (Array.isArray(data.marked_skill_ids)) {
                    this.markedIds = new Set(data.marked_skill_ids);
                }
            }
            catch {
                // ignore load errors
            }
        }
    }
    saveMarks() {
        const saveFile = path.resolve(__dirname, 'marked_for_deletion.json');
        const markedSkills = this.skills.filter((s) => this.markedIds.has(s.id));
        const payload = {
            updated_at: new Date().toISOString(),
            total_marked: this.markedIds.size,
            tokens_saved: markedSkills.reduce((acc, s) => acc + s.tokens, 0),
            marked_skill_ids: Array.from(this.markedIds),
            skills: markedSkills.map((s) => ({
                id: s.id,
                name: s.name,
                scope: s.scope,
                status: s.screenshotStatus,
                tokens: s.tokens,
                orig_path: s.origAbsPath,
            })),
        };
        fs.writeFileSync(saveFile, JSON.stringify(payload, null, 2), 'utf-8');
    }
    getSummary() {
        const total = this.skills.length;
        const marked = this.markedIds.size;
        const keeping = total - marked;
        const markedSkills = this.skills.filter((s) => this.markedIds.has(s.id));
        const tokensSaved = markedSkills.reduce((acc, s) => acc + s.tokens, 0);
        return { total, marked, keeping, tokensSaved };
    }
    printBanner() {
        console.clear();
        const sum = this.getSummary();
        console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║') + chalk.bold.white('          SKILL MASTER — INTERACTIVE DELETION MANAGER (TS)         ') + chalk.bold.cyan('║'));
        console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════════════╝'));
        console.log(chalk.gray('Total: ') + chalk.bold.white(sum.total) +
            chalk.gray(' │ Marked to Delete: ') + (sum.marked > 0 ? chalk.bold.red(sum.marked) : chalk.gray(0)) +
            chalk.gray(' │ Keeping: ') + chalk.bold.green(sum.keeping) +
            chalk.gray(' │ Tokens Freed: ') + (sum.tokensSaved > 0 ? chalk.bold.yellow(sum.tokensSaved.toLocaleString()) : chalk.gray(0)));
        console.log(chalk.gray('─'.repeat(70)));
    }
    async interactiveCheckbox(filterScope, filterStatus) {
        let pool = [...this.skills];
        if (filterScope)
            pool = pool.filter((s) => s.scope === filterScope);
        if (filterStatus)
            pool = pool.filter((s) => s.screenshotStatus === filterStatus);
        // Sort by tokens descending
        pool.sort((a, b) => b.tokens - a.tokens);
        const choices = pool.map((s) => {
            const statusTag = s.screenshotStatus === 'Excluded' ? chalk.yellow('[EXCL]') : chalk.green('[ACTV]');
            const tokenTag = s.tokens > 0 ? chalk.cyan(`${s.tokens.toString().padStart(3, ' ')} tok`) : chalk.gray('       ');
            const scopeTag = s.scope.includes('Workspace') ? chalk.magenta('WS') : s.scope.includes('Plugin') ? chalk.blue('PL') : chalk.gray('GL');
            const filesTag = chalk.gray(`${s.filesCount}f`);
            return {
                name: `${statusTag} ${tokenTag} ${scopeTag} ${chalk.bold(s.name.padEnd(35, ' '))} ${filesTag}`,
                value: s.id,
                checked: this.markedIds.has(s.id),
            };
        });
        console.log(chalk.dim('\nTip: Use Arrow keys to navigate, Space to toggle, [a] to toggle all, [i] to invert, Enter to confirm selection.'));
        const selected = await checkbox({
            message: `Select skills to MARK FOR DELETION (showing ${pool.length} skills):`,
            choices,
            pageSize: 20,
        });
        // Update marked IDs for this pool
        const poolIds = new Set(pool.map((s) => s.id));
        for (const id of poolIds) {
            if (selected.includes(id)) {
                this.markedIds.add(id);
            }
            else {
                this.markedIds.delete(id);
            }
        }
        this.saveMarks();
        console.log(chalk.green(`\n✓ Selections saved! Currently marked: ${this.markedIds.size} skills.`));
    }
    async quickMarkMenu() {
        const action = await select({
            message: 'Choose a quick-mark rule:',
            choices: [
                { name: '⚠  Mark all 78 EXCLUDED skills (Token budget exceeded)', value: 'excluded_all' },
                { name: '📁 Mark all Workspace skills (D:\\AI SEO, GEO)', value: 'workspace_all' },
                { name: '🌐 Mark all Global skills (C:\\Users\\User\\.gemini\\config\\skills)', value: 'global_all' },
                { name: '⚡ Mark Top 25 heaviest skills by token count', value: 'top_25_tokens' },
                { name: '🔄 Deselect all (Reset to 0 marked)', value: 'clear_all' },
                { name: '⬅  Back to main menu', value: 'back' },
            ],
        });
        if (action === 'excluded_all') {
            const count = this.skills.filter((s) => s.screenshotStatus === 'Excluded').length;
            this.skills.filter((s) => s.screenshotStatus === 'Excluded').forEach((s) => this.markedIds.add(s.id));
            console.log(chalk.green(`Marked all ${count} Excluded skills.`));
        }
        else if (action === 'workspace_all') {
            const count = this.skills.filter((s) => s.scope.includes('Workspace')).length;
            this.skills.filter((s) => s.scope.includes('Workspace')).forEach((s) => this.markedIds.add(s.id));
            console.log(chalk.green(`Marked all ${count} Workspace skills.`));
        }
        else if (action === 'global_all') {
            const count = this.skills.filter((s) => s.scope === 'Global Antigravity').length;
            this.skills.filter((s) => s.scope === 'Global Antigravity').forEach((s) => this.markedIds.add(s.id));
            console.log(chalk.green(`Marked all ${count} Global skills.`));
        }
        else if (action === 'top_25_tokens') {
            const top25 = [...this.skills].sort((a, b) => b.tokens - a.tokens).slice(0, 25);
            top25.forEach((s) => this.markedIds.add(s.id));
            console.log(chalk.green(`Marked top 25 heaviest skills.`));
        }
        else if (action === 'clear_all') {
            this.markedIds.clear();
            console.log(chalk.yellow('Cleared all marks. 0 skills marked for deletion.'));
        }
        this.saveMarks();
    }
    async reviewMarked() {
        const markedSkills = this.skills.filter((s) => this.markedIds.has(s.id));
        if (markedSkills.length === 0) {
            console.log(chalk.yellow('\nNo skills are currently marked for deletion.'));
            return;
        }
        console.log(chalk.bold.red(`\n=== SKILLS MARKED FOR DELETION (${markedSkills.length}) ===`));
        console.log(chalk.gray('ID        NAME                                 TOKENS  STATUS    SCOPE'));
        console.log(chalk.gray('─'.repeat(75)));
        let totalTokens = 0;
        let totalFiles = 0;
        for (const s of markedSkills) {
            totalTokens += s.tokens;
            totalFiles += s.filesCount;
            const statusColor = s.screenshotStatus === 'Excluded' ? chalk.yellow : chalk.green;
            console.log(`${chalk.cyan(s.id.padEnd(9))} ` +
                `${chalk.bold(s.name.padEnd(36))} ` +
                `${chalk.yellow(s.tokens.toString().padStart(6))} ` +
                `${statusColor(s.screenshotStatus.padEnd(9))} ` +
                `${chalk.gray(s.scope)}`);
        }
        console.log(chalk.gray('─'.repeat(75)));
        console.log(chalk.bold(`Total: ${markedSkills.length} skills | ${totalTokens.toLocaleString()} tokens | ${totalFiles} files`));
    }
    async executeDeletion() {
        const markedSkills = this.skills.filter((s) => this.markedIds.has(s.id));
        if (markedSkills.length === 0) {
            console.log(chalk.yellow('\nNo skills are marked for deletion!'));
            return;
        }
        console.log(chalk.bold.red('\n⚠ DANGER: PERMANENT DELETION OF ORIGINAL SKILL DIRECTORIES'));
        console.log(chalk.white(`You have selected `) + chalk.bold.red(markedSkills.length) + chalk.white(` skills to delete from your computer.`));
        console.log(chalk.gray('All skills are already backed up byte-for-byte in: ') + chalk.cyan(path.resolve(__dirname, 'skills')));
        const ok = await confirm({
            message: chalk.red(`Are you sure you want to permanently delete these ${markedSkills.length} folders from disk?`),
            default: false,
        });
        if (!ok) {
            console.log(chalk.gray('Aborted. No files were modified or deleted.'));
            return;
        }
        const typeConfirm = await input({
            message: chalk.red('Type "DELETE" in capital letters to confirm:'),
        });
        if (typeConfirm !== 'DELETE') {
            console.log(chalk.yellow('Confirmation text did not match. Operation cancelled.'));
            return;
        }
        // Save timestamped deletion manifest
        const manifestPath = path.resolve(__dirname, `deletion_audit_${Date.now()}.json`);
        fs.writeFileSync(manifestPath, JSON.stringify(markedSkills, null, 2), 'utf-8');
        console.log(chalk.cyan(`\nAudit manifest created: ${manifestPath}`));
        // Perform actual folder deletion
        let deletedCount = 0;
        let failedCount = 0;
        for (const skill of markedSkills) {
            const folderPath = skill.origAbsPath;
            try {
                if (fs.existsSync(folderPath)) {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                    console.log(chalk.red(`[-] Deleted: `) + chalk.gray(folderPath));
                    deletedCount++;
                }
                else {
                    console.log(chalk.yellow(`[!] Directory not found (already gone): `) + chalk.gray(folderPath));
                }
            }
            catch (err) {
                console.error(chalk.red(`[Error] Failed to delete ${folderPath}: ${err.message}`));
                failedCount++;
            }
        }
        console.log(chalk.bold.green(`\n✓ Deletion complete!`));
        console.log(`Successfully deleted: ${chalk.bold.green(deletedCount)} folders`);
        if (failedCount > 0) {
            console.log(`Failed: ${chalk.bold.red(failedCount)} folders`);
        }
        // Clear deleted IDs from marked set and update inventory
        for (const skill of markedSkills) {
            this.markedIds.delete(skill.id);
        }
        this.saveMarks();
        this.loadSkills();
    }
    async run() {
        while (true) {
            this.printBanner();
            const choice = await select({
                message: 'Skill Master Action:',
                choices: [
                    { name: '1. 🔘 Mark / Unmark Skills (Interactive Checkbox List)', value: 'checkbox' },
                    { name: '2. ⚡ Quick-mark by Category (Excluded, Workspace, Top Tokens)', value: 'quick' },
                    { name: '3. 📋 Review Currently Marked Skills & Token Savings', value: 'review' },
                    { name: '4. 💾 Save / Export Deletion Manifest JSON', value: 'export' },
                    { name: '5. 🗑  EXECUTE DELETION OF MARKED SKILLS FROM DISK', value: 'delete' },
                    { name: '6. 🚪 Exit', value: 'exit' },
                ],
            });
            if (choice === 'exit') {
                console.log(chalk.cyan('Goodbye!'));
                break;
            }
            if (choice === 'checkbox') {
                const subChoice = await select({
                    message: 'Which list do you want to mark?',
                    choices: [
                        { name: 'All 180 Skills (Full List)', value: 'all' },
                        { name: '⚠  Only Excluded Skills (78 skills exceeding budget)', value: 'excluded' },
                        { name: '●  Only Active Skills (102 skills)', value: 'active' },
                        { name: '📁 Only Workspace (AI SEO, GEO) (119 skills)', value: 'workspace' },
                        { name: '🌐 Only Global Antigravity (58 skills)', value: 'global' },
                    ],
                });
                if (subChoice === 'all')
                    await this.interactiveCheckbox();
                else if (subChoice === 'excluded')
                    await this.interactiveCheckbox(undefined, 'Excluded');
                else if (subChoice === 'active')
                    await this.interactiveCheckbox(undefined, 'Active');
                else if (subChoice === 'workspace')
                    await this.interactiveCheckbox('Workspace (AI SEO, GEO)');
                else if (subChoice === 'global')
                    await this.interactiveCheckbox('Global Antigravity');
            }
            else if (choice === 'quick') {
                await this.quickMarkMenu();
            }
            else if (choice === 'review') {
                await this.reviewMarked();
                await input({ message: '\nPress Enter to continue...' });
            }
            else if (choice === 'export') {
                this.saveMarks();
                console.log(chalk.green(`\nSaved manifest to marked_for_deletion.json`));
                await input({ message: '\nPress Enter to continue...' });
            }
            else if (choice === 'delete') {
                await this.executeDeletion();
                await input({ message: '\nPress Enter to continue...' });
            }
        }
    }
}
// Direct execution
if (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1]?.endsWith('manage.ts')) {
    const manager = new SkillManager();
    manager.run().catch((err) => {
        console.error(chalk.red('Fatal error:'), err);
        process.exit(1);
    });
}
