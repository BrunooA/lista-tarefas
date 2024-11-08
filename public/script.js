let tasks = [];
db = null;

// Carrega as tarefas ao iniciar
window.onload = function (){
    db = firebase.database();
    loadTasks();
};

function renderDate(dateString) {
    const date  = new Date(dateString);
    const day   = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year  = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Carrega tarefas do Firebase
function loadTasks() {
    db.ref('tasks').once('value')
        .then(snapshot => {
            tasks = snapshot.val() || [];
            if (tasks.length === 0) {
                tasks = [
                    { id: 1, name: "Planejar projeto", cost: 500.0, deadline: "2024-11-30", order: 1 },
                    { id: 2, name: "Definir requisitos", cost: 1200.0, deadline: "2024-12-10", order: 2 },
                    { id: 3, name: "Desenvolver protótipo", cost: 1500.0, deadline: "2024-12-15", order: 3 },
                    { id: 4, name: "Testes iniciais", cost: 800.0, deadline: "2024-12-20", order: 4 },
                    { id: 5, name: "Revisão de código", cost: 700.0, deadline: "2025-01-05", order: 5 }
                ];
                saveTasksToFirebase();
            }
            renderTasks();
        })
        .catch(error => console.error("Erro ao carregar tarefas:", error));
}

// Salva tarefas no Firebase
function saveTasksToFirebase() {
    db.ref('tasks').set(tasks)
        .then(() => console.log("Tarefas salvas com sucesso."))
        .catch(error => console.error("Erro ao salvar tarefas:", error));
}

// Renderiza tarefas na lista Nestable
function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    const nestableList = document.createElement("ol");
    nestableList.className = "dd-list";

    tasks
        .sort((a, b) => a.order - b.order)
        .forEach(task => {
            const item = document.createElement("li");
            item.className = `dd-item nestable-item`;
            item.setAttribute("data-id", task.id);

            // Adiciona a classe de destaque se o custo for >= R$ 1.000,00
            const highlightClass = task.cost >= 1000 ? "table-warning" : "";

            item.innerHTML = `
                <div class="dd-handle ${highlightClass}">
                    <div class='desc'>
                        <span class='title'>${task.name}</span> 
                        <br> 
                        <span>R$ ${task.cost.toFixed(2)} - ${renderDate(task.deadline)}</span> 
                    </div>
                </div>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editTask(${task.id})"><i class='fa fa-edit'></i></button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDelete(${task.id})"><i class='fa fa-trash'></i></button>
                </div>
            `;
            nestableList.appendChild(item);
        });

    taskList.appendChild(nestableList);
    initializeNestable();
}

// Configura o Nestable para permitir arrastar e soltar
function initializeNestable() {
    $('#task-list').nestable({
        maxDepth: 1,
    }).on('change', updateTaskOrder);
}

// Atualiza a ordem das tarefas após rearranjo
function updateTaskOrder() {
    const updatedOrder = $('#task-list').nestable('serialize');
    updatedOrder.forEach((item, index) => {
        const task = tasks.find(t => t.id === parseInt(item.id));
        if (task) task.order = index + 1;
    });
    tasks.sort((a, b) => a.order - b.order);
    saveTasksToFirebase();
}

// Abre o modal para adicionar ou editar uma tarefa
function openTaskModal() {
    document.getElementById("task-id").value = "";
    document.getElementById("task-name").value = "";
    document.getElementById("task-cost").value = "";
    document.getElementById("task-deadline").value = "";
    new bootstrap.Modal(document.getElementById("taskModal")).show();
}

// Abre o modal para editar uma tarefa específica
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById("task-id").value = task.id;
        document.getElementById("task-name").value = task.name;
        document.getElementById("task-cost").value = task.cost;
        document.getElementById("task-deadline").value = task.deadline;
        new bootstrap.Modal(document.getElementById("taskModal")).show();
    }
}

// Salva a tarefa no Firebase e atualiza a lista
function saveTask(event) {
    event.preventDefault();
    const id = document.getElementById("task-id").value;
    const name = document.getElementById("task-name").value;
    const cost = parseFloat(document.getElementById("task-cost").value);
    const deadline = document.getElementById("task-deadline").value;

    if (tasks.some(task => task.name === name && task.id !== parseInt(id))) {
        alert("Tarefa com o mesmo nome já existe!");
        return;
    }

    if (id) {
        const task = tasks.find(t => t.id == id);
        task.name = name;
        task.cost = cost;
        task.deadline = deadline;
    } else {
        tasks.push({
            id: Date.now(),
            name,
            cost,
            deadline,
            order: tasks.length + 1
        });
    }

    saveTasksToFirebase();
    renderTasks();
    bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();
}

// Confirma a exclusão de uma tarefa
function confirmDelete(taskId) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
        deleteTask(taskId);
    }
}

// Exclui a tarefa
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToFirebase();
    renderTasks();
}

$("#taskModal").on('hidden.bs.modal',function(){
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
    $("body").css("overflow","unset").css("padding-right","unset");
});
