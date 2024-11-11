#include <iostream> 
using namespace std; 
int main (){ 
int a,b,c; 
cout<<"Digite tres numeros: "; 
cin>>a>>b>>c; 
if ((a>=b) && (b>c)) cout<<a<<b<<c; 
else if ((a>=c) && (c>b)) {cout<<a<<c<<b;} 
else if ((b>=a) && (a>c)) {cout<<b<<a<<c;} 
else if ((b>=c) && (c>a)) {cout<<b<<c<<a;} 
else if ((c>=a) && (a>b)) {cout<<c<<a<<b;} 
else if ((c>=b) && (b>a)) {cout<<c<<b<<a;} 
else if ((a==b) && ( b == c)) {cout<<a<<b<<c;} 
system ("pause > null"); 
return 0;
}