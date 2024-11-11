#include <iostream>
using namespace std;

int main() {
    int primeiro = 0, segundo = 0, terceiro = 1; // Os tr�s primeiros n�meros da s�rie tribonacci
    int proximo = primeiro + segundo + terceiro;

    cout << "N�meros da s�rie tribonacci entre 100 e 800:\n";
    //A s�rie tribonacci � uma sequ�ncia semelhante � sequ�ncia de Fibonacci, mas em vez de come�ar com dois n�meros iniciais, come�a com tr�s.

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
    /*O programa utiliza um loop while para gerar os n�meros da s�rie tribonacci e imprime apenas aqueles que s�o maiores que 100 e menores que 800. 
	A sequ�ncia � calculada somando os tr�s n�meros anteriores para obter o pr�ximo n�mero na s�rie.*/

    return 0;
}
