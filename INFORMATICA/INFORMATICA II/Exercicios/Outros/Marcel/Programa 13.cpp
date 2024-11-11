#include <iostream>
using namespace std;

int main(){
	//calculo do perimetro do rectangulo
	int l, c, perimetro;
	cout << "Perimetro do rectangulo\n";
	cout << "Digite a medida da largura : ";
	cin >> l;
	cout << "\n""Digite a medida do comprimento: ";
	cin >> c;
	perimetro = 2*(c+l);
	cout << "\n""O perimetro do rectangulo e igual a: "<< perimetro ;"\n";
	return 0;
}
