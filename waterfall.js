class WaterfallClass {

    // Constructor
    constructor(args) {
        this.tasks = args.tasks || [];
        this.variables = args.variables || {};

        this.options = args.options || {};
        this.setOptions(this.options);

    }

    // Set options
    setOptions = (options) => {
        this.options = options;

        this.options.asynchronous = this.options.asynchronous ?? true;
        this.options.verbose = this.options.verbose ?? false;
    }

    // Set variables
    setVariables = (variables) => {
        this.variables = variables;
    }

    log = (message) => {
        if (!this.options.verbose) return;
        console.log(message);
    }
    
    /* 
        Set tasks
        -----
        Pass in an array of tasks as an argument.

        A task can be a promise or a regular function. See the 
        usage example at the bottom/github/docs for more clarity.
    */
    setTasks(tasks) {
        this.tasks = tasks.map((task, index) => {

            // Validate each task
            if (!this.validateTask(task)) {
                console.error('Invalid task at index: ' + index);
                return null;
            }
            else {
                var metadata = {
                    "id": this.generateUUID().split("-")[0],
                    "task": task
                };
                this.log(`Setting task: ${metadata.id}`);
                return metadata;
            }
        });
        
        // Delete null tasks
        this.tasks = this.tasks.filter(task => task !== null);

        return this.tasks;
    }

    /* 
        Add a task
        -----
        Pass in a task as the argument.
        Returns task's metadata
    */
    addTask(task) {
        if (!this.validateTask(task)) {
            console.error('Invalid task. Please provide functions.');
            return null;
        }
        else {
            var metadata = {
                "id": this.generateUUID().split("-")[0],
                "task": task 
            };
            this.tasks.push(metadata);
            this.log(`Adding task: ${metadata.id}`);
            return metadata;
        }
    }

    /* 
        Delete a task
        -----
        Pass task ID as the argument
    */
    deleteTask(id) {
        // Check if a task with the specified ID exists
        if (!this.tasks.some(task => task.id === id)) {
            console.log(`No task found with ID ${id}`);
            return false;
        }
        else {
            this.tasks = this.tasks.filter(task => task.id!== id);
            this.log(`Deleting task: ${metadata.id}`);
            return true;
        }
    }

    /* 
        Execute all tasks
    */
    executeTasks() {

        return new Promise ((resolve, reject) => {
            var that = this;
            this.log(`Initializing waterfall. ${this.tasks ? this.tasks.length : 0} tasks.`);
            
            const executeTask = async (index) => {
                if (!this.tasks[index]) return null;
                
                this.log(`  >  Executing task ${this.tasks[index].id}`);
                
                /* 
                    Next function for synchronous functions
                    This will cause the waterfall to wait until next() is called in
                    synchronous tasks.
                */
                var next = () => {

                    this.log(`  >>   Next called after task ${this.tasks[index].id}`);

                    // Execute next task
                    executeTask(index + 1);
                    if (index + 1 == that.tasks.length) resolve (that.variables);
                }
                
                var returnedPromise = this.tasks[index].task(that.variables, next);

                /*
                    If the execution is requested to be asynchronous, the tasks
                    do not wait for the previous task to be completed.
                    However, waterfall will not resolve until all the tasks are
                    completed.
                */
                if (!this.options.asynchronous) {

                    // Execute next task
                    executeTask(index + 1);
                    if (index + 1 == that.tasks.length) resolve (that.variables, next);
                }

                // Asynchronous task returns a pending promise
                if (returnedPromise && returnedPromise.then && typeof returnedPromise.then == "function") {
                    returnedPromise
                        .then (function (variables) {

                            if (this.options.asynchronous) {
                                // Execute next task
                                executeTask(index + 1);
                                if (index + 1 == that.tasks.length) resolve (that.variables, next);
                            }
                        })
                        .catch (function (variables) {

                            if (this.options.asynchronous) {
                                // Execute next task
                                executeTask(index + 1);
                                if (index + 1 == that.tasks.length) resolve (that.variables, next);
                            }
                        });
                }

                // Synchronous task; Doesn't return a pending promise
                else {
                    // Do nothing
                }

                return that.variables;
            };

            // Start executing tasks from the first index
            executeTask(0);
        });
    }

    generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    validateTask = (task) => {
        return typeof task === 'function';
    }
}


// Factory
function Waterfall(options) {
    return new WaterfallClass(options);
}


/*
    ! Usage example
    ----------------

    wf = Waterfall({
        options: {
            asynchronous: true,
            verbose: true
        },
        variables: {
            "test": "Oranges"
        }
    });

    wf.setVariables({"test": "Apple"});

    wf.setTasks([
        (variables, next) => {
            console.log("H 1");
            variables["stage-1"] = "executed";

            /* Do not forget to call next() *\/
            next();
        },
        (variables) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log("H 2");
                    variables["stage-2"] = "executed";

                    /* If the task is a promise, call resolve() instead of next() *\/
                    resolve();
                },  2000);
            });
        },
        (variables, next) => {
            console.log("H 3");
            variables["stage-3"] = "executed";

            domtoimage.toPng(document.querySelector(".letterhead.back"))
                .then(function (pageTwoImage) {
                    variables["page-2"] = pageTwoImage;

                    /* Call next() *\/
                    next();
                });
        },
        (variables) => {
            console.log("H 4");
            variables["stage-4"] = "executed";

            /* If next() is not called, the waterfall will stop at this point *\/
        }
    ]);

    /* Execute all tasks *\/
    wf.executeTasks().then((data) => {
        console.log("All tasks executed");
        console.log(data);
    });

*/