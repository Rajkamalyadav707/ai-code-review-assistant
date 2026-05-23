// Dummy code with intentional issues for testing the AI code review assistant

import * as fs from 'fs';
import * as crypto from 'crypto';

// ISSUE: Hardcoded credentials
const API_KEY = "sk-1234567890abcdef";
const DATABASE_PASSWORD = "admin123";
const SECRET_TOKEN = "my-secret-token-12345";

// ISSUE: Hardcoded database connection
const DB_HOST = "192.168.1.100";
const DB_PORT = 5432;

export class UserService {
    // ISSUE: SQL Injection vulnerability
    async getUserByUsername(username: string) {
        const query = `SELECT * FROM users WHERE username = '${username}'`;
        // This is vulnerable to SQL injection
        return this.executeQuery(query);
    }

    // ISSUE: Inefficient algorithm - O(n²) complexity
    findDuplicates(arr: number[]): number[] {
        const duplicates = [];
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i] === arr[j]) {
                    duplicates.push(arr[i]);
                }
            }
        }
        return duplicates;
    }

    // ISSUE: Synchronous file operations blocking the event loop
    readConfigFile(): any {
        const data = fs.readFileSync('/etc/config.json', 'utf8');
        return JSON.parse(data);
    }

    // ISSUE: Weak cryptography
    hashPassword(password: string): string {
        return crypto.createHash('md5').update(password).digest('hex');
    }

    // ISSUE: No error handling
    async processUserData(userId: string) {
        const user = await this.getUser(userId);
        const profile = await this.getProfile(user.profileId);
        const settings = await this.getSettings(profile.settingsId);
        return { user, profile, settings };
    }

    // ISSUE: Memory leak - event listeners not removed
    setupEventListeners() {
        setInterval(() => {
            console.log('Checking status...');
            this.checkStatus();
        }, 1000);
    }

    // ISSUE: Hardcoded API endpoint
    async fetchData() {
        const response = await fetch('http://api.example.com/data?key=' + API_KEY);
        return response.json();
    }

    // ISSUE: eval() usage - security risk
    executeCode(code: string) {
        return eval(code);
    }

    // ISSUE: No input validation
    createUser(userData: any) {
        return {
            username: userData.username,
            email: userData.email,
            password: this.hashPassword(userData.password),
            apiKey: API_KEY
        };
    }

    // ISSUE: Inefficient string concatenation in loop
    generateReport(items: string[]): string {
        let report = '';
        for (let i = 0; i < items.length; i++) {
            report = report + items[i] + '\n';
        }
        return report;
    }

    // Helper methods (also with issues)
    private async executeQuery(query: string): Promise<any> {
        // Simulated database query
        console.log('Executing query:', query);
        return [];
    }

    private async getUser(userId: string): Promise<any> {
        return { id: userId, profileId: '123' };
    }

    private async getProfile(profileId: string): Promise<any> {
        return { id: profileId, settingsId: '456' };
    }

    private async getSettings(settingsId: string): Promise<any> {
        return { id: settingsId };
    }

    private checkStatus() {
        // Status check logic
    }
}

// ISSUE: Global mutable state
let globalCounter = 0;

export function incrementCounter() {
    globalCounter++;
    return globalCounter;
}

// ISSUE: Unused variable
const unusedVariable = "This is never used";

// ISSUE: Console.log in production code
console.log("Database password:", DATABASE_PASSWORD);
console.log("API Key:", API_KEY);

// Made with Bob
