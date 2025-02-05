import * as fs from "fs";
import * as vscode from "vscode";

let FILE_PATH = "";

// Load existing data or create a new list
export function loadData(): any[] {
    try {
        if (FILE_PATH === ""){
            return []
        }
        const data = fs.readFileSync(FILE_PATH, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return []; // Return an empty list if the file doesn't exist or is invalid
    }
}

// Save data to file
export function saveData(data: any[]): void {
    if (FILE_PATH === ""){
        return 
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

// Add new data
export function addData(newEntry: any): void {
    let data = loadData();
    if (data.length > 5){
        removeLastData()
        removeLastData()
    }
    data = loadData();
    data.push(newEntry);
    saveData(data);
    console.log("Added:", newEntry);
}

// Remove the latest (last) entry
export function removeLastData(): void {

    const data = loadData();
    if (data.length > 0) {
        const removed = data.shift(); // Remove the last element
        saveData(data);
        console.log("Removed:", removed);
    } else {
        console.log("No data to remove.");
    }
}

// Read all data
export function readAllData() {
    const data = loadData();
    let historychat = ''
    data.forEach(element => {
        historychat+= JSON.stringify(element)
    });
    
    return historychat
}


export function getExtensionPath(context: vscode.ExtensionContext): string {
    FILE_PATH = context.extensionPath + '/database/historychat.json'
    console.log(FILE_PATH)
    return context.extensionPath; // Returns the full directory path

}

