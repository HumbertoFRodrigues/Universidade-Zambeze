#include <iostream> // Inclui a biblioteca de entrada/sa°da padr∆o

using namespace std; // Permite o uso direto de elementos da biblioteca padr∆o (cout, cin) sem precisar digitar "std::" antes

int main() {
    // Declaraá∆o das vari†veis
    int num1, num2, result;

    // Solicita ao usu†rio que digite o primeiro n£mero
    cout << "Digite um numero: ";
    cin >> num1; // Là o n£mero digitado e armazena em 'num1'

    // Solicita ao usu†rio que digite o segundo n£mero
    cout << "Digite outro numero: ";
    cin >> num2; // Là o n£mero digitado e armazena em 'num2'

    // Calcula a soma dos dois n£meros e armazena em 'result'
    result = num1 + num2;

    // Exibe o resultado da soma na tela
    cout << "A soma dos numeros e igual a: " << result << "\n";

    return 0; // Retorna 0 para indicar que o programa foi executado com sucesso
}
