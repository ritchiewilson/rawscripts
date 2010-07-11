import re
from django.utils import simplejson
import StringIO
from collections import deque
import sys, os
import string
import time
import zipfile
import logging

def Text(data):
    t = data.read()
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
            if j<24:
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
                if i.isupper():
                    test=True
                if test==True:
                    kind=0
                else:
                    kind=1
            elif j<29:
                kind=3
            elif j<34:
                kind=4
            elif j<40:
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
    j=simplejson.dumps(arr)
    return j

def Celtx(data):
    z = zipfile.ZipFile(data)
    zlist = z.namelist()
    i=0
    while i< len(zlist):
        b = zlist[i].split('ript')
        if len(b) > 1:
            script = zlist[i]
        i=i+1
    txt = z.read(script)
    headless= txt.split('<body>')[1]
    t=headless.split('</body>')[0]
    pattern = re.compile(r'<span.*?">', re.DOTALL)
    t = re.sub(pattern, '', t)
    t = t.replace("</span>","")
    t = t.replace(" <br>",'')
    t = t.replace("<br> ",'')
    t = t.replace("<br>",'')
    t = t.replace('\n', ' ')
    t = t.replace('\r\n', " ")
    t = t.replace('&nbsp;','')
    t = t.replace(' (cont)', '')
    t = t.replace(' (CONT)', '')
    t = t.replace(' (Cont)', '')
    parts = t.split('</p>')
    parts.pop()

    jl=[]
    count=0
    for i in parts:
        unit=[]
        i=i.replace('"',"'")
        unit.append
        if i[4]=='i':
            unit.append(i.split('>')[1])
            unit.append(0)
        else:
            unit.append(i.split('>')[1])
            if i[11]=='a':
                unit.append(1)
            if i[11]=='c':
                unit.append(2)
            if i[11]=='d':
                unit.append(3)
            if i[11]=='p':
                unit.append(4)
            if i[11]=='t':
                unit.append(5)
        jl.append(unit)
    for i in jl:
        i[0]=i[0].rstrip()
    
    contents=simplejson.dumps(jl)
    return contents
