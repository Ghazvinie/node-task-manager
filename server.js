const { EventEmitter } = require('events');
const fs = require('fs');

class Server extends EventEmitter {
    constructor(client) {
        super();
        this.tasks = {};
        this.taskId = 1;
        process.nextTick(() => {
            this.emit('response', 'Type a command, or \'help\' to list all commands');
        });
        client.on('command', (command, args) => {
            switch (command) {
                case 'help':
                case 'add':
                case 'ls':
                case 'delete':
                case 'save':
                case 'load':
                case 'deleteLocal' :
                    this[command](args);
                    break;
                default:
                    this.emit('response', 'Unknown Command!');
            }
        });
    }
    tasksString() {
        return Object.keys(this.tasks).map(element => `\n Task ${element}: ${this.tasks[element]}`).join(' ');
    }
    saveTasks() {
        const data = JSON.stringify(this.tasks);
        fs.writeFile('tasks.json', data, 'utf8', (error) => {
            if (error) console.log('There as been a save error', error);
        });
    }
    async loadTasks() {
        return new Promise((resolve, reject) => {
            fs.readFile('tasks.json', 'utf8', (error, data) => {
                if (error) {
                    console.log('There has been a loading error', error);
                } else {
                    this.tasks = JSON.parse(data);
                    resolve();
                }
            });
        });
    }
    async deleteLocalFile () {
        return new Promise ((resolve, reject) => {
            fs.unlink('tasks.json', (error) => {
                if (error) {
                    console.log('deleteLocal Error', error);
                } else {
                    resolve();
                }
            });
        });
    }

    help() {
        this.emit('response', `Available commands:
        add <task>
        ls
        delete <id>
        save (tasks to local file)
        load (tasks from local file - will overwrite any currently stored tasks)
        deleteLocal (deletes local tasks file - this cannot be undone!)`);
    }
    add(args) {
        this.tasks[this.taskId] = args.join(' ');
        console.log(this.tasks);
        this.emit('response', `Added the task(s) ${this.tasks[this.taskId]}\nTask Number: ${this.taskId} `);
        this.taskId++;
    }
    ls() {
        if (Object.keys(this.tasks).length === 0) {
            this.emit('response', 'There are no tasks, try adding one');
        }else {
            this.emit('response', `The tasks are: ${this.tasksString()} `);
        }
    }
    delete(args) {
        delete (this.tasks[args[0]]);
        this.emit('response', `Deleted task ${args[0]}`);
    }
    save() {
        if (Object.keys(this.tasks).length === 0) {
            this.emit('response', 'No tasks to be saved');
        } else {
            this.saveTasks();
            this.emit('response', `${Object.keys(this.tasks).length} task(s) have been saved`);
        }
    }
    async load() {
        await this.loadTasks();
        this.emit('response', `${Object.keys(this.tasks).length} task(s) have been loaded`);
    }
    async deleteLocal() {
        await this.deleteLocalFile();
        this.emit('response', 'Local tasks file has been deleted');        
    }
}

module.exports = (client) => new Server(client);
