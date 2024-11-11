#include <iostream>
using namespace std;

int main(){
	//calculo do perimetro do triangulo
	int l1, l2, l3, perimetro;
	cout << "Perimetro do Triangulo\n";
	cout << "Digite a medida do lado 1: ";
	cin >> l1;
	cout << "\n""Digite a Medida do lado 2: ";
	cin >> l2;
	cout << "\n""Digite a medida do lado 3: ";
	cin >> l3;
	perimetro = l1+l2+l3;
	cout << "\n""O perimetro do triangulo e igual a: "<< perimetro ;"\n";
	return 0;
}
