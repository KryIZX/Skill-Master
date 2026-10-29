export interface SkillItem {
    id: string;
    name: string;
    declaredName: string;
    screenshotStatus: 'Excluded' | 'Active';
    scope: string;
    origAbsPath: string;
    backupRepoPath: string;
    filesCount: number;
    tokens: number;
    description: string;
}
export interface InventoryRaw {
    repository: string;
    generated_at: string;
    skills: Array<{
        item_id: string;
        name: string;
        declared_name?: string;
        screenshot_status?: 'Excluded' | 'Active';
        scope?: string;
        orig_abs_path?: string;
        backup_repo_path?: string;
        files_count?: number;
        description?: string;
    }>;
}
export declare class SkillManager {
    private skills;
    private markedIds;
    private readonly inventoryPath;
    constructor();
    private loadSkills;
    private loadSavedMarks;
    private saveMarks;
    getSummary(): {
        total: number;
        marked: number;
        keeping: number;
        tokensSaved: number;
    };
    printBanner(): void;
    interactiveCheckbox(filterScope?: string, filterStatus?: string): Promise<void>;
    quickMarkMenu(): Promise<void>;
    reviewMarked(): Promise<void>;
    executeDeletion(): Promise<void>;
    run(): Promise<void>;
}
