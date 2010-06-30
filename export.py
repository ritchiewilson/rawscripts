import json
import StringIO
from collections import deque

def Text(data):
  widths=[[62,15,1],[62,15,1],[40,35,0],[36,25,1],[35,30,0],[62,61,1]]
  txt = json.loads(data)
  
  s = StringIO.StringIO()
  s.write('\n\n\n')
  parenTest=False
  for i in txt:
      #lingering parentheses problem
      if parenTest==True:
          if not i[1]==4:
              s.write('\n')
          parenTest=False
      
      words = deque(i[0].split(' '))
      if not i[1]==5:
          spaces=widths[i[1]][1]
      else:
          diff=0
          for j in words:
              diff+=len(j)+1
          spaces=77-diff
      k=0
      while k<=spaces:
          s.write(' ')
          k+=1
          
      linewidth=0
      
      for j in words:
          if linewidth>widths[i[1]][0]:
              linewidth=0
              s.write('\n')
              k=0
              while k<widths[i[1]][1]:
                  s.write(' ')
                  k+=1
          if i[1]==0:
              v=j.upper()
          elif i[1]==2:
              v=j.upper()
          elif i[1]==5:
              v=j.upper()
          else:
              v=j
          s.write(v)
          s.write(' ')
          linewidth+=len(j)+1
      s.write('\n')
      #save paren for next time around to be sure
      if i[1]==3:
          parenTest=True
      elif widths[i[1]][2]==1:
          s.write('\n')
    
  return s
