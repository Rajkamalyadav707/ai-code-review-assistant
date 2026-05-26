// Dummy code with intentional issues for testing the AI code review assistant

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as child_process from 'child_process';

// ISSUE: Hardcoded credentials
const API_KEY = "sk-1234567890abcdef";
const DATABASE_PASSWORD = "admin123";
const SECRET_TOKEN = "my-secret-token-12345";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...";

// ISSUE: Hardcoded database connection
const DB_HOST = "192.168.1.100";
const DB_PORT = 5432;
const MONGODB_URI = "mongodb://admin:password123@localhost:27017/mydb";

// ISSUE: Hardcoded JWT secret
const JWT_SECRET = "super-secret-jwt-key-12345";

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

    // ISSUE: Command injection vulnerability
    executeSystemCommand(userInput: string) {
        return child_process.execSync(`ls -la ${userInput}`).toString();
    }

    // ISSUE: Path traversal vulnerability
    readUserFile(filename: string) {
        const filePath = `/var/data/${filename}`;
        return fs.readFileSync(filePath, 'utf8');
    }

    // ISSUE: Regex DoS (ReDoS) vulnerability
    validateEmail(email: string): boolean {
        const regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email);
    }

    // ISSUE: Insecure random number generation
    generateToken(): string {
        return Math.random().toString(36).substring(2);
    }

    // ISSUE: Prototype pollution vulnerability
    mergeObjects(target: any, source: any) {
        for (const key in source) {
            target[key] = source[key];
        }
        return target;
    }

    // ISSUE: XXE (XML External Entity) vulnerability
    parseXML(xmlString: string) {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'text/xml');
    }

    // ISSUE: Insecure deserialization
    deserializeData(data: string) {
        return JSON.parse(data);
    }

    // ISSUE: Race condition
    async updateBalance(userId: string, amount: number) {
        const user = await this.getUser(userId);
        const newBalance = user.balance + amount;
        await this.saveBalance(userId, newBalance);
    }

    // ISSUE: Infinite loop potential
    processItems(items: any[]) {
        let i = 0;
        while (i < items.length) {
            if (items[i].skip) {
                continue; // Missing i++ causes infinite loop
            }
            console.log(items[i]);
            i++;
        }
    }

    // ISSUE: Callback hell / Pyramid of doom
    async complexOperation(id: string, callback: Function) {
        this.getUser(id).then(user => {
            this.getProfile(user.profileId).then(profile => {
                this.getSettings(profile.settingsId).then(settings => {
                    callback(null, { user, profile, settings });
                }).catch(err => callback(err));
            }).catch(err => callback(err));
        }).catch(err => callback(err));
    }

    // ISSUE: Missing await
    async saveData(data: any) {
        this.validateData(data);
        this.processData(data);
        return this.storeData(data);
    }

    // ISSUE: Floating promises
    processAsync(data: any) {
        this.asyncOperation1(data);
        this.asyncOperation2(data);
        this.asyncOperation3(data);
    }

    // Helper methods (also with issues)
    private async executeQuery(query: string): Promise<any> {
        // Simulated database query
        console.log('Executing query:', query);
        return [];
    }

    private async getUser(userId: string): Promise<any> {
        return { id: userId, profileId: '123', balance: 1000 };
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

    private async saveBalance(userId: string, balance: number) {
        // Save balance logic
    }

    private async validateData(data: any) {
        // Validation logic
    }

    private async processData(data: any) {
        // Processing logic
    }

    private async storeData(data: any) {
        // Storage logic
    }

    private async asyncOperation1(data: any) {
        // Async operation 1
    }

    private async asyncOperation2(data: any) {
        // Async operation 2
    }

    private async asyncOperation3(data: any) {
        // Async operation 3
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
const anotherUnusedVar = 42;

// ISSUE: Console.log in production code
console.log("Database password:", DATABASE_PASSWORD);
console.log("API Key:", API_KEY);
console.log("AWS Secret:", AWS_SECRET_KEY);

// ISSUE: Hardcoded IP addresses
const ALLOWED_IPS = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];

// ISSUE: Insecure cookie settings
export function setCookie(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/`;
}

// ISSUE: Missing HTTPS enforcement
export function makeRequest(endpoint: string) {
    return fetch(`http://api.example.com/${endpoint}`);
}

// ISSUE: Weak session management
export class SessionManager {
    private sessions: Map<string, any> = new Map();

    createSession(userId: string) {
        const sessionId = Math.random().toString(36);
        this.sessions.set(sessionId, { userId, createdAt: Date.now() });
        return sessionId;
    }

    // ISSUE: No session expiration
    getSession(sessionId: string) {
        return this.sessions.get(sessionId);
    }
}

// ISSUE: Unvalidated redirect
export function redirect(url: string) {
    window.location.href = url;
}

// ISSUE: Missing rate limiting
export async function loginAttempt(username: string, password: string) {
    const user = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    return user.json();
}

// ISSUE: Exposed error details
export function handleError(error: Error) {
    return {
        error: error.message,
        stack: error.stack,
        details: error
    };
}

// ISSUE: Insecure CORS configuration
export const corsConfig = {
    origin: '*',
    credentials: true
};

// ISSUE: Missing input sanitization
export function renderHTML(userInput: string) {
    document.getElementById('content')!.innerHTML = userInput;
}

// ISSUE: Timing attack vulnerability
export function comparePasswords(input: string, stored: string): boolean {
    if (input.length !== stored.length) return false;
    for (let i = 0; i < input.length; i++) {
        if (input[i] !== stored[i]) return false;
    }
    return true;
}

// ISSUE: Missing CSP headers
export const securityHeaders = {
    'X-Frame-Options': 'DENY'
    // Missing Content-Security-Policy
};

// Made with Bob
