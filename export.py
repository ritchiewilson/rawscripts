

from django.utils import simplejson
import StringIO
from collections import deque
import sys, os
import string
import time
import logging
from google.appengine.ext import db
from google.appengine.api import users

def Text(data, title, title_page, resource_id):
  widths=[[62,15,1],[62,15,1],[40,35,0],[35,25,1],[35,30,0],[62,61,1]]
  txt = simplejson.loads(data)
  
  s = StringIO.StringIO()

  if str(title_page)==str(1):
    q=db.GqlQuery("SELECT * FROM TitlePageData "+
               "WHERE resource_id='"+resource_id+"'")
    results=q.fetch(2)
    if len(results)==0:
      p=TitlePageData()
      p.title = title
      p.authorOne = users.get_current_user().nickname()
      p.authorTwo = ""
      p.authorTwoChecked = ""
      p.authorThree = ""
      p.authorThreeChecked= ""
      p.based_on = ""
      p.based_onChecked = ""
      p.address = ""
      p.addressChecked = ""
      p.phone = ""
      p.phoneChecked = ""
      p.cell = ""
      p.cellChecked = ""
      p.email = users.get_current_user().email()
      p.emailChecked = "checked"
      p.registered= ""
      p.registeredChecked = ""
      p.other = ""
      p.otherChecked = ""
      p.put()
      r=p
    else:
      r=results[0]

    s.write("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
    count=25
    space=0
    while space<(80-len(r.title))/2:
      space+=1
      s.write(" ")
    s.write(r.title+"\n\n\n")
    count+=3
    
    s.write("                                   Written by\n\n\n")
    space=0
    while space<(80-len(r.authorOne))/2:
      space+=1
      s.write(" ")
    s.write(r.authorOne+"\n")
    if r.authorTwoChecked=="checked":
      space=0
      while space<(80-len(r.authorTwo))/2:
        space+=1
        s.write(" ")
      s.write(r.authorTwo)
    s.write("\n")
    if r.authorThreeChecked=="checked":
      space=0
      while space<(80-len(r.authorThree))/2:
        space+=1
        s.write(" ")
      s.write(r.authorThree)
    s.write("\n")
    count+=3
    if r.based_onChecked=="checked":
      lines=r.based_on.split("LINEBREAK")
      for line in lines:
        space=0
        while space<(80-len(line))/2:
          space+=1
          s.write(" ")
        s.write(line+"\n")
        count+=1
    while count<=35:
      count+=1
      s.write("\n")
    if r.addressChecked=="checked":
      lines=r.address.split("LINEBREAK")
      for line in lines:
        s.write(line+"\n")
        count+=1
    s.write("\n\n")
    count+=2
    if r.phoneChecked=="checked":
      s.write(r.phone+"\n")
      count+=1
    if r.cellChecked=="checked":
      s.write(r.cell+"\n")
      count+=1
    s.write("\n")
    count+=1
    if r.emailChecked=="checked":
      s.write(r.email+"\n")
      count+=1
    s.write("\n")
    count+=1
    if r.registeredChecked=="checked":
      s.write(r.registered+"\n")
      count+=1
    s.write("\n\n")
    count+=2
    if r.otherChecked=="checked":
      s.write(r.other+"\n")
      count+=1

    while count<=60:
      count+=1
      s.write("\n")
    
  
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
      while k<spaces:
          s.write(' ')
          k+=1
          
      linewidth=0
      
      for j in words:
          if linewidth+len(j)>widths[i[1]][0]:
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

def Pdf(data, title, title_page, resource_id):
  widths=[[61,7,1],[61,7,1],[40,32,0],[35,22,1],[35,27,0],[61,61,1]]
  txt = simplejson.loads(data)
  more="                                   (MORE)\n"
  cont="(CONT'D)"
  lines=[]
  parenTest=False

  for i in txt:
    w=[]
    words = deque(i[0].split(' '))
    linewidth=0
    line=''
    k=0
    while k<widths[i[1]][1]:
      line+=' '
      k+=1
    for j in words:
      if linewidth+len(j)>widths[i[1]][0]:
        linewidth=0
        w.append(line.rstrip())
        line=''
        k=0
        while k<widths[i[1]][1]:
          line+=' '
          k+=1
      line+=j+' '
      linewidth+=len(j)+1
    w.append(line.rstrip())
    if widths[i[1]][2]:
      w.append('')
    lines.append(w)
  linecount=0
  i=0
  pageN=2
  while  i<(len(lines)-1):
    if linecount+len(lines[i])<56:
      if txt[i][1]==2 or txt[i][1]==0 or txt[i][1]==5:
        lines[i][0]=lines[i][0].upper().rstrip()
      linecount+=len(lines[i])
      i+=1
    else:
      if linecount<53 and linecount+len(lines[i])>57 and txt[i][1]==3:
        char=lines[i-1][0]
        diff =55-linecount
        linecount=len(lines[i])-diff+1
        lines[i].insert(diff, more)
        
        lines[i].insert(diff+1,'                                                                 '+str(pageN)+'.')
        pageN+=1
        lines[i].insert(diff+2,'')
        lines[i].insert(diff+3,'')
        lines[i].insert(diff+4, char+"(CONT'D)")
        i+=1
      elif linecount<53 and len(lines[i])>4 and txt[i][1]==3:
        char=lines[i-1][0]
        diff=len(lines[i])-3
        lines[i].insert(diff, more)
        lines[i].insert(diff+1,'')
        lines[i].insert(diff+2,'                                                                 '+str(pageN)+'.')
        pageN+=1
        lines[i].insert(diff+3,'')
        lines[i].insert(diff+4,'')
        lines[i].insert(diff+5, char+"(CONT'D)")
        linecount=4
        i+=1
      else:
        i-=1
        while txt[i][1]==0 or txt[i][1]==2 or txt[i][1]==4:
          linecount-=len(lines[i])
          i-=1
        while linecount<=56:
          lines[i].append('')
          linecount+=1
        lines[i].append('                                                                 '+str(pageN)+'.')
        lines[i].append('')
        lines[i].append('')
        pageN+=1
        linecount=0
        i+=1

  lines[0].insert(0,'')
  lines[0].insert(0,'')
  lines[0].insert(0,'')

  i=0
  chara=''
  while i<len(lines)-1:
    if txt[i][1]==0:
      chara=''
    elif not chara=='':
      if lines[i][0].lstrip()==chara and txt[i][1]==2:
        lines[i][0]=lines[i][0]+" (CONT'D)"
    if txt[i][1]==2:
      chara=lines[i][0].lstrip()
    i+=1
  s=StringIO.StringIO()
  if str(title_page)==str(1):
    q=db.GqlQuery("SELECT * FROM TitlePageData "+
               "WHERE resource_id='"+resource_id+"'")
    results=q.fetch(2)
    if len(results)==0:
      p=TitlePageData()
      p.title = title
      p.authorOne = users.get_current_user().nickname()
      p.authorTwo = ""
      p.authorTwoChecked = ""
      p.authorThree = ""
      p.authorThreeChecked= ""
      p.based_on = ""
      p.based_onChecked = ""
      p.address = ""
      p.addressChecked = ""
      p.phone = ""
      p.phoneChecked = ""
      p.cell = ""
      p.cellChecked = ""
      p.email = users.get_current_user().email()
      p.emailChecked = "checked"
      p.registered= ""
      p.registeredChecked = ""
      p.other = ""
      p.otherChecked = ""
      p.put()
      r=p
    else:
      r=results[0]

    s.write("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
    count=20
    space=0
    while space<(80-len(r.title))/2:
      space+=1
      s.write(" ")
    s.write(r.title+"\n\n\n")
    count+=3
    
    s.write("                                   Written by\n\n\n")
    space=0
    while space<(80-len(r.authorOne))/2:
      space+=1
      s.write(" ")
    s.write(r.authorOne+"\n")
    if r.authorTwoChecked=="checked":
      space=0
      while space<(80-len(r.authorTwo))/2:
        space+=1
        s.write(" ")
      s.write(r.authorTwo)
    s.write("\n")
    if r.authorThreeChecked=="checked":
      space=0
      while space<(80-len(r.authorThree))/2:
        space+=1
        s.write(" ")
      s.write(r.authorThree)
    s.write("\n\n")
    count+=4
    if r.based_onChecked=="checked":
      ls=r.based_on.split("LINEBREAK")
      for l in ls:
        space=0
        while space<(80-len(l))/2:
          space+=1
          s.write(" ")
        s.write(l+"\n")
        count+=1
    while count<=35:
      count+=1
      s.write("\n")
    if r.addressChecked=="checked":
      ls=r.address.split("LINEBREAK")
      for l in ls:
        s.write("     "+l+"\n")
        count+=1
    s.write("\n")
    count+=1
    if r.phoneChecked=="checked":
      s.write("          "+r.phone+"\n")
      count+=1
    if r.cellChecked=="checked":
      s.write("     "+r.cell+"\n")
      count+=1
    s.write("\n")
    count+=1
    if r.emailChecked=="checked":
      s.write("     "+r.email+"\n")
      count+=1
    s.write("\n")
    count+=1
    if r.registeredChecked=="checked":
      s.write("     "+r.registered+"\n")
      count+=1
    s.write("\n")
    count+=1
    if r.otherChecked=="checked":
      s.write("     "+r.other+"\n")
      count+=1

    while count<=57:
      count+=1
      s.write("\n")
  for i in lines:
    for t in i:
      s.write(t)
      s.write('\n')


# http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/189858

  

  LF_EXTRA=0
  LINE_END='\015'
  # form feed character (^L)
  FF=chr(12)

  ENCODING_STR = """\
  /Encoding <<
  /Differences [ 0 /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /space /exclam
  /quotedbl /numbersign /dollar /percent /ampersand
  /quoteright /parenleft /parenright /asterisk /plus /comma
  /hyphen /period /slash /zero /one /two /three /four /five
  /six /seven /eight /nine /colon /semicolon /less /equal
  /greater /question /at /A /B /C /D /E /F /G /H /I /J /K /L
  /M /N /O /P /Q /R /S /T /U /V /W /X /Y /Z /bracketleft
  /backslash /bracketright /asciicircum /underscore
  /quoteleft /a /b /c /d /e /f /g /h /i /j /k /l /m /n /o /p
  /q /r /s /t /u /v /w /x /y /z /braceleft /bar /braceright
  /asciitilde /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /.notdef /.notdef /.notdef /.notdef /.notdef /.notdef
  /dotlessi /grave /acute /circumflex /tilde /macron /breve
  /dotaccent /dieresis /.notdef /ring /cedilla /.notdef
  /hungarumlaut /ogonek /caron /space /exclamdown /cent
  /sterling /currency /yen /brokenbar /section /dieresis
  /copyright /ordfeminine /guillemotleft /logicalnot /hyphen
  /registered /macron /degree /plusminus /twosuperior
  /threesuperior /acute /mu /paragraph /periodcentered
  /cedilla /onesuperior /ordmasculine /guillemotright
  /onequarter /onehalf /threequarters /questiondown /Agrave
  /Aacute /Acircumflex /Atilde /Adieresis /Aring /AE
  /Ccedilla /Egrave /Eacute /Ecircumflex /Edieresis /Igrave
  /Iacute /Icircumflex /Idieresis /Eth /Ntilde /Ograve
  /Oacute /Ocircumflex /Otilde /Odieresis /multiply /Oslash
  /Ugrave /Uacute /Ucircumflex /Udieresis /Yacute /Thorn
  /germandbls /agrave /aacute /acircumflex /atilde /adieresis
  /aring /ae /ccedilla /egrave /eacute /ecircumflex
  /edieresis /igrave /iacute /icircumflex /idieresis /eth
  /ntilde /ograve /oacute /ocircumflex /otilde /odieresis
  /divide /oslash /ugrave /uacute /ucircumflex /udieresis
  /yacute /thorn /ydieresis ]
  >>
  """


  PROG_HELP = """asdf"""
  
  # version number
  self._version="0.1"
  # iso encoding flag
  self._IsoEnc=0
  # formfeeds flag
  self._doFFs=0
  self._progname="RawScripts.com"
  self._appname = "".join((self._progname, " Version ", str(self._version)))
  # default font
  self._font="/Courier"
  # default font size
  self._ptSize=11
  # default vert space
  self._vertSpace=12
  self._lines=60
  # number of characters in a row
  self._cols=80
  self._columns=1
  # page ht
  self._pageHt=792
  # page wd
  self._pageWd=612
  # input file 
  self._ifile=s
  # output file 
  self._ofile=StringIO.StringIO()
  # default tab width
  self._tab=4
  # input file descriptor
  self._ifs=None
  # output file descriptor
  self._ofs=None
  # landscape flag
  self._landscape=0
  #title taken from DB
  self._title=title

  # marker objects
  self._curobj = 5
  self._pageObs = [0]
  self._locations = [0,0,0,0,0,0]
  self._pageNo=0

  # file position marker
  self._fpos=0

  
  
            

    
  """ Perform the actual conversion """

  if self._lines==0:
      self._lines = (self._pageHt - 72)/self._vertSpace
  if self._lines < 1:
      self._lines=1
  
  self._ifs=StringIO.StringIO(self._ifile.getvalue())
  
  

  
  self._ofs = self._ofile

  WriteHeader(self)
  WritePages(self)
  WriteRest(self)
  

  return self._ofs
    
    
def StartPage(self):
    """ Start a page of data """

    ws = writestr
    
    self._pageNo += 1
    self._curobj += 1

    self._locations.append(self._fpos)
    self._locations[self._curobj]=self._fpos

    self._pageObs.append(self._curobj)
    self._pageObs[self._pageNo] = self._curobj
    
    buf = "".join((str(self._curobj), " 0 obj\n"))

    ws(self, buf)
    ws(self, "<<\n")
    ws(self, "/Type /Page\n")
    ws(self, "/Parent 3 0 R\n")
    ws(self, "/Resources 5 0 R\n")

    self._curobj += 1
    buf = "".join(("/Contents ", str(self._curobj), " 0 R\n"))
    ws(self, buf)
    ws(self, ">>\n")
    ws(self, "endobj\n")
    
    self._locations.append(self._fpos)
    self._locations[self._curobj] = self._fpos

    buf = "".join((str(self._curobj), " 0 obj\n"))
    ws(self, buf)
    ws(self, "<<\n")
    
    buf = "".join(("/Length ", str(self._curobj + 1), " 0 R\n"))
    ws(self, buf)
    ws(self, ">>\n")
    ws(self, "stream\n")
    strmPos = self._fpos

    ws(self, "BT\n");
    buf = "".join(("/F1 ", str(self._ptSize), " Tf\n"))
    ws(self, buf)
    buf = "".join(("1 0 0 1 50 ", str(self._pageHt - 40), " Tm\n"))
    ws(self, buf)
    buf = "".join((str(self._vertSpace), " TL\n"))
    ws(self, buf)

    return strmPos

def EndPage(self, streamStart):
    """End a page of data """
    
    ws = writestr

    ws(self, "ET\n")
    streamEnd = self._fpos
    ws(self, "endstream\n")
    ws(self, "endobj\n")

    self._curobj += 1
    self._locations.append(self._fpos)
    self._locations[self._curobj] = self._fpos

    buf = "".join((str(self._curobj), " 0 obj\n"))
    ws(self, buf)
    buf = "".join((str(streamEnd - streamStart), '\n'))
    ws(self, buf)
    ws(self, 'endobj\n')

def WritePages(self):
    """Write pages as PDF"""
    FF=chr(12)
    ws = writestr

    beginstream=0
    lineNo, charNo=0,0
    ch, column=0,0
    padding,i=0,0
    atEOF=0
    
    while not atEOF:
        beginstream = StartPage(self)
        column=1
        
        while column <= self._columns:
            column += 1
            atFF=0
            atBOP=0
            lineNo=0
        
            while lineNo < self._lines and not atFF and not atEOF:
                
                lineNo += 1
                ws(self, "(")
                charNo=0
                
                while charNo < self._cols:
                    charNo += 1
                    ch = self._ifs.read(1)
                    cond = ((ch != '\n') and not(ch==FF and self._doFFs) and (ch != ''))
                    if not cond:
                        break

                    if ord(ch) >= 32 and ord(ch) <= 127:
                        if ch == '(' or ch == ')' or ch == '\\':
                            ws(self, "\\")
                        ws(self, ch)
                    else:
                        if ord(ch) == 9:
                            padding =self._tab - ((charNo - 1) % self._tab)
                            for i in range(padding):
                                ws(self, " ")
                            charNo += (padding -1)
                        else:
                            if ch != FF:
                                # write \xxx form for dodgy character
                                buf = "".join(('\\', ch))
                                ws(self, buf)
                            else:
                                # dont print anything for a FF
                                charNo -= 1

                ws(self, ")'\n")
                if ch == FF:
                    atFF=1
                if lineNo == self._lines:
                    atBOP=1
                    
                if atBOP:
                    pos=0
                    ch = self._ifs.read(1)
                    pos= self._ifs.tell()
                    if ch == FF:
                        ch = self._ifs.read(1)
                        pos=self._ifs.tell()
                    # python's EOF signature
                    if ch == '':
                        atEOF=1
                    else:
                        # push position back by one char
                        self._ifs.seek(pos-1)

                elif atFF:
                    ch = self._ifs.read(1)
                    pos=self._ifs.tell()
                    if ch == '':
                        atEOF=1
                    else:
                        self._ifs.seek(pos-1)

            if column < self._columns:
                buf = "".join(("1 0 0 1 ",
                               str((self._pageWd/2 + 25)),
                               " ",
                               str(self._pageHt - 40),
                               " Tm\n"))
                ws(self, buf)

        EndPage(self, beginstream)

def WriteRest(self):
    """Finish the file"""
    LINE_END='\015'
    ws = writestr
    self._locations[3] = self._fpos

    ws(self, "3 0 obj\n")
    ws(self, "<<\n")
    ws(self, "/Type /Pages\n")
    buf = "".join(("/Count ", str(self._pageNo), "\n"))
    ws(self, buf)
    buf = "".join(("/MediaBox [ 0 0 ", str(self._pageWd), " ", str(self._pageHt), " ]\n"))
    ws(self, buf)
    ws(self, "/Kids [ ")

    for i in range(1, self._pageNo+1):
        buf = "".join((str(self._pageObs[i]), " 0 R "))
        ws(self, buf)

    ws(self, "]\n")
    ws(self, ">>\n")
    ws(self, "endobj\n")
    
    xref = self._fpos
    ws(self, "xref\n")
    buf = "".join(("0 ", str((self._curobj) + 1), "\n"))
    ws(self, buf)
    buf = "".join(("0000000000 65535 f ", str(LINE_END)))
    ws(self, buf)

    for i in range(1, self._curobj + 1):
        val = self._locations[i]
        buf = "".join((string.zfill(str(val), 10), " 00000 n ", str(LINE_END)))
        ws(self, buf)

    ws(self, "trailer\n")
    ws(self, "<<\n")
    buf = "".join(("/Size ", str(self._curobj + 1), "\n"))
    ws(self, buf)
    ws(self, "/Root 2 0 R\n")
    ws(self, "/Info 1 0 R\n")
    ws(self, ">>\n")
    
    ws(self, "startxref\n")
    buf = "".join((str(xref), "\n"))
    ws(self, buf)
    ws(self, "%%EOF\n")

    
def WriteHeader(self):
  """Write the PDF header"""

  ws = writestr

  t=time.localtime()
  timestr=str(time.strftime("D:%Y%m%d%H%M%S", t))
  ws(self, "%PDF-1.4\n")
  self._locations[1] = self._fpos
  ws(self, "1 0 obj\n")
  ws(self, "<<\n")

  buf = "".join(("/CreationDate (", timestr, ")\n"))
  ws(self, buf)
  buf = "".join(("/Producer (", self._appname, "(\\Rawscripts.com 2010))\n"))
  ws(self, buf)


  ws(self, ">>\n")
  ws(self, "endobj\n")

  self._locations[2] = self._fpos

  ws(self, "2 0 obj\n")
  ws(self, "<<\n")
  ws(self, "/Type /Catalog\n")
  ws(self, "/Pages 3 0 R\n")
  ws(self, ">>\n")
  ws(self, "endobj\n")

  self._locations[4] = self._fpos
  ws(self, "4 0 obj\n")
  ws(self, "<<\n")
  buf = "".join(("/BaseFont ", str(self._font), " /Encoding /WinAnsiEncoding /Name /F1 /Subtype /Type1 /Type /Font >>\n"))
  ws(self, buf)

  if self._IsoEnc:
      ws(self, ENCODING_STR)
      
  ws(self, ">>\n")
  ws(self, "endobj\n")

  self._locations[5] = self._fpos

  ws(self, "5 0 obj\n")
  ws(self, "<<\n")
  ws(self, "  /Font << /F1 4 0 R >>\n")
  ws(self, "  /ProcSet [ /PDF /Text ]\n")
  ws(self, ">>\n")
  ws(self, "endobj\n")

def writestr(self, str):
  """ Write string to output file descriptor.
  All output operations go through this function.
  We keep the current file position also here"""

  # update current file position
  self._fpos += len(str)
  for x in range(0, len(str)):
      if str[x] == '\n':
          self._fpos += 0
  try:
      self._ofs.write(str)
  except IOError, e:
      print e
      return -1

  return 0

class TitlePageData (db.Model):
  resource_id = db.StringProperty()
  title = db.StringProperty()
  authorOne = db.StringProperty()
  authorTwo = db.StringProperty()
  authorTwoChecked = db.StringProperty()
  authorThree  = db.StringProperty()
  authorThreeChecked  = db.StringProperty()
  based_on  = db.StringProperty()
  based_onChecked  = db.StringProperty()
  address = db.StringProperty()
  addressChecked = db.StringProperty()
  phone = db.StringProperty()
  phoneChecked = db.StringProperty()
  cell = db.StringProperty()
  cellChecked = db.StringProperty()
  email = db.StringProperty()
  emailChecked = db.StringProperty()
  registered = db.StringProperty()
  registeredChecked = db.StringProperty()
  other = db.StringProperty()
  otherChecked = db.StringProperty()

class self:
    _version=""

