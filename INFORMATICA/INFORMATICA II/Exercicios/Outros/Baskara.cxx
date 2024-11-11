#include <iostream>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>

using namespace std;
int main(){

float a, b, c, delt;
double  x1, x2, raiz;
cout<<"digite A";
cin>>a;
cout<<"digite B";
cin>>b;
cout<<"digite C";
cin>>c;

delt=((b*b)-4*a*c);
raiz=sqrt(delt);
x1=(-b + raiz)/2*a;

x2=(-b - raiz)/2*a;

 cout<<"X1 é:"<<x1;
 cout<<"\nX2 é"<< x2;

 cin.get();
}