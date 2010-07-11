import re
import json

f=file('/Users/ritchiewilson/Desktop/Western.txt')
t = f.read()
lines = t.split('\n')
arr=[]
for i in lines:
    i=i.rstrip()
    if i=="":
        arr.append(['blank',7])
    else:
        j=0
        while i[j]==' ':
            j+=1
        i=i.lstrip()
        if j==15:
            test=False
            if i[0]=='I' or i[0]=='i':
                if i[1]=='N'or i[1]=='n':
                    if i[2]=='T' or i[2]=='t':
                        if i[3]=='.':
                            test=True
                            
            if i[0]=='E' or i[0]=='e':
                if i[1]=='X'or i[1]=='e':
                    if i[2]=='T' or i[2]=='t':
                        if i[3]=='.':
                            test=True
            if test==True:
                kind=0
            else:
                kind=1
        elif j==25:
            kind=3
        elif j==30:
            kind=4
        elif j==35:
            kind=2
        else:
            if i[0]=='0' or i[0]=='1' or i[0]=='2' or i[0]=='3' or i[0]=='4' or i[0]=='5' or i[0]=='6' or i[0]=='7' or i[0]=='8' or i[0]=='9':
                kind=7
            else:
                kind=5
        
        arr.append([i,kind])

while arr[len(arr)-1][1]==7:
    arr.pop()
while arr[0][1]==7:
    arr.remove(['blank',7])

i=0
while i<len(arr)-1:
    if arr[i][1]==7:
        arr.pop(i)
    elif arr[i][1]==arr[i+1][1]:
        arr[i][0]=arr[i][0]+' '+arr[i+1][0]
        arr.pop(i+1)
    else:
        i+=1
j=json.dumps(arr)
print j
