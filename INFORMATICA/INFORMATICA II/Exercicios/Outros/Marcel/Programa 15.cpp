#include <iostream>
using namespace std;
#define pi 3.14
int main(){
	//calculo de perimetro da circunferencia
	int r, perimetro;
	cout << "Perimetro da Circunferencia\n";
	cout << "Digite a medida do raio: ";
	cin >> r;
	perimetro = 2*r*pi;
	cout << "O perimetro da circunferencia e igual a: " << perimetro; "\n";
	return 0;
}
