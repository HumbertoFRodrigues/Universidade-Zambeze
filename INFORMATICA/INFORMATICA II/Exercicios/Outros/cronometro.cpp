#include <iostream>
#include <chrono>
#include <thread>

int main() {
    std::cout << "Cronometro Simples\n";
    std::cout << "Pressione Enter para iniciar e parar o cronometro.\n";

    std::cin.get(); // Aguarda o usu rio pressionar Enter para iniciar o cron“metro

    auto start = std::chrono::high_resolution_clock::now(); // Marca o tempo de in¡cio

    std::cout << "Cronometro iniciado. Pressione Enter para parar.\n";
    std::cin.get(); // Aguarda o usu rio pressionar Enter para parar o cron“metro

    auto end = std::chrono::high_resolution_clock::now(); // Marca o tempo de parada

    // Calcula a diferen‡a de tempo para obter o tempo decorrido em segundos
    std::chrono::duration<double> elapsed_seconds = end - start;
    double elapsed_time = elapsed_seconds.count();

    std::cout << "Tempo decorrido: " << elapsed_time << " segundos.\n";

    return 0;
}
