#include <iostream>
using namespace std;

int main(){
	//calculo da area do triangulo
	int base, altura, area;
	cout << "Area do Triangulo\n";
	cout << "Digite a medida da Base: ";
	cin >> base;
	cout << "\n""Digite a Medida da Altura: ";
	cin >> altura;
	area = (base*altura)/2;
	cout << "\n""A Area do triangulo e igual a: "<< area ;"\n";
	return 0;
}
