#include <iostream>

int main() {
    int escolha;
    double quantidade;

    std::cout << "Conversor de Tempo\n";
    std::cout << "Escolha a unidade de tempo de origem:\n";
    std::cout << "1. Segundos\n";
    std::cout << "2. Minutos\n";
    std::cout << "3. Horas\n";
    std::cout << "Opcao: ";
    std::cin >> escolha;

    std::cout << "Digite a quantidade de tempo: ";
    std::cin >> quantidade;

    double resultado;

    switch (escolha) {
        case 1: // ConversÆo de segundos para outras unidades
            resultado = quantidade / 60; // Segundos para minutos
            std::cout << quantidade << " segundos equivalem a " << resultado << " minutos." << std::endl;
            resultado = quantidade / 3600; // Segundos para horas
            std::cout << quantidade << " segundos equivalem a " << resultado << " horas." << std::endl;
            break;
        case 2: // ConversÆo de minutos para outras unidades
            resultado = quantidade * 60; // Minutos para segundos
            std::cout << quantidade << " minutos equivalem a " << resultado << " segundos." << std::endl;
            resultado = quantidade / 60; // Minutos para horas
            std::cout << quantidade << " minutos equivalem a " << resultado << " horas." << std::endl;
            break;
        case 3: // ConversÆo de horas para outras unidades
            resultado = quantidade * 3600; // Horas para segundos
            std::cout << quantidade << " horas equivalem a " << resultado << " segundos." << std::endl;
            resultado = quantidade * 60; // Horas para minutos
            std::cout << quantidade << " horas equivalem a " << resultado << " minutos." << std::endl;
            break;
        default:
            std::cout << "Opcao invalida." << std::endl;
            break;
    }

    return 0;
}
