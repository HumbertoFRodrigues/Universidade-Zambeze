#include <iostream>
#include <vector>
#include <string>

// Defini‡Æo da estrutura de tarefa
struct Task {
    std::string description;
    bool completed;
};

// Fun‡Æo para adicionar uma nova tarefa
void addTask(std::vector<Task>& tasks) {
    Task newTask;
    std::cin.ignore(); // Limpar o buffer
    std::cout << "Digite a descri‡Æo da tarefa: ";
    std::getline(std::cin, newTask.description);
    newTask.completed = false;
    tasks.push_back(newTask);
    std::cout << "Tarefa adicionada com sucesso!\n";
}

// Fun‡Æo para listar todas as tarefas
void listTasks(const std::vector<Task>& tasks) {
    std::cout << "Lista de Tarefas:\n";
    for (size_t i = 0; i < tasks.size(); ++i) {
        std::cout << i + 1 << ". ";
        if (tasks[i].completed) {
            std::cout << "[Conclu¡da] ";
        }
        std::cout << tasks[i].description << "\n"; // Quebra de linha para cada tarefa
    }
}

// Fun‡Æo para marcar uma tarefa como conclu¡da
void markTaskCompleted(std::vector<Task>& tasks) {
    int taskNumber;
    std::cout << "Digite o n£mero da tarefa conclu¡da: ";
    std::cin >> taskNumber;
    if (taskNumber > 0 && taskNumber <= static_cast<int>(tasks.size())) {
        tasks[taskNumber - 1].completed = true;
        std::cout << "Tarefa marcada como conclu¡da!\n";
    } else {
        std::cout << "N£mero de tarefa inv lido.\n";
    }
}

int main() {
    std::vector<Task> tasks;
    int choice;

    while (true) {
        std::cout << "Sistema de Gerenciamento de Tarefas\n";
        std::cout << "1. Adicionar Tarefa\n";
        std::cout << "2. Listar Tarefas\n";
        std::cout << "3. Marcar Tarefa como Conclu¡da\n";
        std::cout << "4. Sair\n";
        std::cout << "Escolha uma op‡Æo: ";
        std::cin >> choice;

        switch (choice) {
            case 1:
                addTask(tasks);
                break;
            case 2:
                listTasks(tasks);
                break;
            case 3:
                markTaskCompleted(tasks);
                break;
            case 4:
                std::cout << "Encerrando o programa.\n";
                return 0;
            default:
                std::cout << "Op‡Æo inv lida. Tente novamente.\n";
        }
    }

    return 0;
}
