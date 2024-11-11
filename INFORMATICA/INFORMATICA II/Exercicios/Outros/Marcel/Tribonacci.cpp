#include <iostream>
using namespace std;

int main() {
    int primeiro = 0, segundo = 0, terceiro = 1; // Os três primeiros números da série tribonacci
    int proximo = primeiro + segundo + terceiro;

    cout << "Números da série tribonacci entre 100 e 800:\n";
    //A série tribonacci é uma sequência semelhante à sequência de Fibonacci, mas em vez de começar com dois números iniciais, começa com três.

    while (proximo < 800) {
        if (proximo > 100) {
            cout << proximo << " ";
        }
        primeiro = segundo;
        segundo = terceiro;
        terceiro = proximo;
        proximo = primeiro + segundo + terceiro;
    }

    cout << endl;
    /*O programa utiliza um loop while para gerar os números da série tribonacci e imprime apenas aqueles que são maiores que 100 e menores que 800. 
	A sequência é calculada somando os três números anteriores para obter o próximo número na série.*/

    return 0;
}
