#include <iostream>
using namespace std;
#define pi 3.14
int main(){
	//calculo da area da circunferencia
	int r, area;
	cout << "Area da Circunferencia\n";
	cout << "Digite a medida do raio: ";
	cin >> r;
	area = pi*(r*r);
	cout << "A area da circunferencia e igual a: " << area; "\n";
	return 0;
}
