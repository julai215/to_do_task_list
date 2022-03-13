"use strict";

class TaskManager {

    /**
     * update()      - creeaza/updateaza lista de task-uri din localStorage
     *
     * @param task   -  task-ul care se va adauga in localStorage
     * @param action  - "remove" pentru stergerea task-ului din localStorage, "add" pentru adaugarea lui,
     *                  "check" pt marcarea lui ca si checked, "uncheck" pentru marcarea lui ca unchecked
     */
    updateLocalStorage (task, action, index) {

        // salvarea task-urilor intr-un array intr-o cheie din localStorage
        let local_tasks;

        if (!localStorage.getItem("Tasks")) {
            local_tasks = [];
        } else {
            local_tasks = JSON.parse(localStorage.getItem("Tasks"));
        }

        if (action === "add") {
            local_tasks.push({
                task_name: task,
                checked: false,
            });
        } else if (action === "check") {
            local_tasks.forEach((local_task_element, local_index) => {
                if (local_task_element.task_name === task.task_name && local_index === parseInt(index)) {
                    local_task_element.checked = true;
                }
            });
        } else if (action === "uncheck") {
            local_tasks.forEach((local_task_element, local_index) => {
                if (local_task_element.task_name === task.task_name && local_index === parseInt(index)) {
                    local_task_element.checked = false;
                }
            });
        } else if (action === "remove") {
                local_tasks.splice(index, 1);
        }
        localStorage.setItem("Tasks", JSON.stringify(local_tasks));
    }

}

class TasksList extends TaskManager {

    constructor () {
        super();
        this.task_list = document.querySelector(".task-list");
        this.template_frag = new Template("#template", this.populateDocFragment);
    }

    /**
     * getTaskTitle() -   returneaza valoarea din elementul html de task
     *
     * @param {string} task - elementul html de task
     * @returns valoarea din elementul html de task
     */
    getTaskTitle (task) {
        const value = task.querySelector(".title");
        return value.textContent;
    }

    /**
     * getTaskIndex() -   returneaza index-ul din elementul html de task
     *
     * @param {string} task - elementul html de task
     * @returns valoarea index-ului
     */
     getTaskIndex (task) {
        return task.getAttribute("data-index");
    }

    /**
     * showError() -   returneaza un obiect de tip promise cu statusul rejected
     *
     * @param {string} msg - mesajul ce va fi intors
     * @returns un obiect de tip promise cu statusul rejected
     */
    showError (msg) {
        return new Promise((resolve, reject) => reject(msg));
    }

    /**
     * getLatestTaskIndex() -   returneaza cel mai mare index din lista
     *
     * @returns un numar
     */
    getLatestTaskIndex () {
        // in cazul in care deja exista task-uri in lista, trebuie sa luam urmatorul index
        const lista = document.querySelectorAll(".task");
        let highest_index = null;
        lista.forEach((element) => {
            if (element.getAttribute("data-index") >= highest_index) {
                highest_index = element.getAttribute("data-index");
            }
        });
        if (highest_index !== null) {
            highest_index = parseInt(highest_index) + 1;
        } else if (highest_index === null) {
            highest_index = 0;
        }

        return highest_index;
    }

    /**
     * addTask() -   adauga task-ul pe UI si apeleaza functia pentru a updata in localStorage
     *
     */
    addTask () {

        const search_input = document.querySelector(".text");

        // verificam ca valoarea din input sa nu fie goala sau doar empty spaces
        if (search_input.value.trim().length === 0) {
            this.showError("Ati lasat campul gol!")
            // .then(result => alert(result))
                .catch((err) => alert(err));
            return;
        }

        // se adauga task-ul in localStorage
        this.updateLocalStorage(search_input.value, "add");

        // populam lista cu taskul adaugat
        this.task_list.appendChild(this.template_frag.fillCollection([search_input.value]));

        // facem clear la input dupa ce s-a adaugat task-ul
        search_input.value = "";

    }

    /**
     * removeTask()          -   sterge task-ul pe UI si apeleaza functia pentru a updata in localStorage
     *
     * @param {string} task  -  task-ul care trebuie sters
     */
    removeTask (task) {

        this.updateLocalStorage({task_name: this.getTaskTitle(task)}, "remove",  this.getTaskIndex(task));

        task.parentNode.removeChild(task);

        // after removing a task from the DOM, refresh the data-index values
        const tasks = document.querySelectorAll(".task");
        tasks.forEach((task_element, index) => {
            task_element.setAttribute("data-index", index);
        });

    }

    /**
     * markTaskStatus() -   marcheaza task-ul pe UI ca done/undone si apeleaza functia pentru a updata in localStorage
     *
     * @param {string} task       -  task-ul care trebuie modificat
     */
    markTaskStatus (task) {

        let status;
        if (task.classList.contains("done")) {
            status = "uncheck";
            task.classList.remove("done");
        } else {
            status = "check";
            task.classList.add("done");
        }

        this.updateLocalStorage({task_name: this.getTaskTitle(task)}, status, this.getTaskIndex(task));

    }

    /**
     * showAllTasks()    - populeaza task-urile pe interfata luandu-le din localStorage
     *
     */
    showAllTasks () {

        const local_tasks = JSON.parse(localStorage.getItem("Tasks"));

        if (local_tasks) {
            this.task_list.appendChild(this.template_frag.fillCollection(local_tasks));
        }
    }

     /**
     * populateDocFragment() -   populeaza un document fragment cu atribute si valori
     *
     * @param {string/object}  taskData   - valoarea task-ului sau un obiect cu chei si valori din localStorage
     * @param {object}         result     - document fragmentul pe care se construieste
     * @param {integer}        index      - index-ul taskului pentru a seta atributul de data-index
     */
    populateDocFragment = (taskData, result, index) => {
        result.querySelector(".title").textContent = typeof taskData === "object" ? taskData.task_name : taskData;
        const div_task = result.querySelector(".task");
        if (taskData.checked === true) {
            div_task.setAttribute("class", "task done");
        }
        index = this.getLatestTaskIndex() ? this.getLatestTaskIndex() : index;
        div_task.setAttribute("data-index", index);
    }

}

class Task extends TasksList {

    constructor () {
        super();
    }

    /**
     * eventListener()    - asculta la actiunile de pe pagina
     *
     * @param {}
     */
    eventListener () {

        this.showAllTasks();

        // adaugare event pentru click pe butonul +
        const btn = document.querySelector(".add");
        btn.addEventListener("click", (() => {

            this.addTask();

        }));

        // adaugare event pentru enter in input
        const key = document.querySelector(".text");
        key.addEventListener("keypress", ((event) => {

            if (event.key === "Enter") {
                this.addTask();
            }

        }));

        // trigger pe click-uri in lista cu task-uri
        document.querySelector(".task-list").addEventListener("click", ((event) => {

            // daca se apasa pe delete
            if (event.target && event.target.nodeName == "BUTTON" && event.target.classList.contains("delete")) {
                this.removeTask(event.target.parentNode);
            }

            // daca se apasa pe icon sau task title
            if (event.target && event.target.nodeName == "DIV" && event.target.classList.contains("icon")) {
                this.markTaskStatus(event.target.parentNode);
            }

        }));

    }

}

const tasks = new Task();
tasks.eventListener();
