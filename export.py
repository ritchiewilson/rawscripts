import json
import StringIO
from collections import deque

def Text(data):
  widths=[[62,15,1],[62,15,1],[40,35,0],[35,25,1],[35,30,0],[62,61,1]]
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

def Pdf(data):
  widths=[[61,7,1],[61,7,1],[40,32,0],[35,22,1],[35,27,0],[61,61,1]]
  txt = json.loads(data)
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
        
        lines[i].insert(diff+1,'                                                                      '+str(pageN)+'.')
        pageN+=1
        lines[i].insert(diff+2,'')
        lines[i].insert(diff+3,'')
        lines[i].insert(diff+4, char+"(CONT'D)")
        i+=1
      elif linecount<53 and len(lines[i])>4 and txt[i][1]==3:
        char=lines[i-1][0]
        diff=len(lines[i])-3
        lines[i].insert(diff, more)
        lines[i].insert(diff+1,'                                                                      '+str(pageN)+'.')
        pageN+=1
        lines[i].insert(diff+2,'')
        lines[i].insert(diff+3,'')
        lines[i].insert(diff+4, char+"(CONT'D)")
        linecount=3
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
  for i in lines:
    for t in i:
      s.write(t)
      s.write('\n')


# http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/189858

import sys, os
import string
import time
import getopt

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


class pyText2Pdf:

    def __init__(self):
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
        self._ifile=""
        # output file 
        self._ofile=""
        # default tab width
        self._tab=4
        # input file descriptor
        self._ifs=None
        # output file descriptor
        self._ofs=None
        # landscape flag
        self._landscape=0

        # marker objects
        self._curobj = 5
        self._pageObs = [0]
        self._locations = [0,0,0,0,0,0]
        self._pageNo=0

        # file position marker
        self._fpos=0

    def argsCallBack(self, argslist, listoftuples=False):
        """ Callback function called by argument parser.
        Helps to remove duplicate code """

        x = 0
        while x<len(argslist):
            item = argslist[x]

            if listoftuples:
                o, a = item
            else:
                o = item

            if o == '-h':
                self.ShowHelp()
            elif o == '-I':
                self._IsoEnc=1
            elif o == '-F':
                self._doFFs=1
            elif o == '-2':
                self._columns=2
            elif o == '-L':
                self._landscape=1
                    
            if o in ('-f', '-s', '-l', '-x', 'y', '-c', '-v', '-o', '-O'):
                
                if not listoftuples:
                    x += 1
                    try:
                        a = argslist[x]
                    except:
                        msg = "Argument error for option " + o
                        sys.exit(msg)

                if a == "" or a[0] == "-":
                    msg = "Error: argument error for option " + o
                    sys.exit(msg)
                elif o == '-f':
                    self._font='/' + a
                elif o == '-A':
                    if a == '3':
                        self._pageWd=842
                        self._pageHt=1190
                    elif a =='4':
                        self._pageWd=595
                        self._pageHt=842
                    else:
                        psz=o[1]+a
                        print self._progname, ': ignoring unknown paper size ', psz
                elif o == '-s':
                    self._ptSize=int(a)
                    if self._ptSize<1:
                        self._ptSize=1
                elif o == '-v':
                    self._vertSpace=int(a)
                    if self._vertSpace<1:
                        self._vertSpace=1       
                elif o == '-l':
                    self._lines=int(a)
                    if self._lines<1:
                        self._lines=1
                elif o == '-c':
                    self._cols=int(a)
                    if self._cols<4:
                        self._cols=4
                elif o == '-t':
                    self._tab=int(a)
                    if self._tab<1:
                        self._tab=1
                elif o == '-x':
                    self._pageWd=int(a)
                    if self._pageWd<72:
                        self._pageWd=72
                elif o == '-y':
                    self._pageHt=int(a)
                    if self._pageHt<72:
                        self._pageHt=72
                elif o in ('-o', '-O'):
                    self._ofile=a
                else:
                    print self._progname, ': ignoring invalid switch: ', o

            x += 1

        
    def parseArgs(self):

        if len(sys.argv) == 1:
            self.ShowHelp()

        arguments=sys.argv[1:]
        
        optlist, args = getopt.getopt(arguments, 'hIF2Lf:A:s:v:l:c:t:x:y:o:')
        
        # input file is the first element in arg list
        # or last element in options list (in case of an error!)
        if len(args):
            self._ifile=args[0]
        else:
            l=len(optlist)
            tup=optlist[l-1]

        # parse options list
        if len(optlist):
            self.argsCallBack( optlist, listoftuples=True )
        else:
            self.argsCallBack( args )

        if self._landscape:
            print 'Landscape option on...'
        if self._columns==2:
            print 'Printing in two columns...'
        if self._doFFs:
            print 'Ignoring form feed character...'
        if self._IsoEnc:
            print 'Using ISO Latin Encoding...'
        print 'Using font', self._font[1:], ' size =', self._ptSize
            

    def writestr(self, str):
        """ Write string to output file descriptor.
        All output operations go through this function.
        We keep the current file position also here"""

        # update current file position
        self._fpos += len(str)
        for x in range(0, len(str)):
            if str[x] == '\n':
                self._fpos += LF_EXTRA
        try:
            self._ofs.write(str)
        except IOError, e:
            print e
            return -1

        return 0
            
    def Convert(self):
        """ Perform the actual conversion """
    
        if self._landscape:
            # swap page width & height
            tmp = self._pageHt
            self._pageHt = self._pageWd
            self._pageWd = tmp

        if self._lines==0:
            self._lines = (self._pageHt - 72)/self._vertSpace
        if self._lines < 1:
            self._lines=1
        
        try:
            self._ifs=open(self._ifile)
        except IOError, (strerror, errno):
            print 'Error: Could not open file to read --->', self._ifile
            sys.exit(3)

        if self._ofile=="":
            self._ofile=self._ifile + '.pdf'

        try:
            self._ofs = open(self._ofile, 'wb')
        except IOError, (strerror, errno):
            print 'Error: Could not open file to write --->', self._ofile
            sys.exit(3)

        print 'Input file =>', self._ifile
        print 'Writing pdf file', self._ofile, '...'
        self.WriteHeader(self._ifile)
        self.WritePages()
        self.WriteRest()

        print 'Wrote file', self._ofile
        self._ifs.close()
        self._ofs.close()
        return 0

    def WriteHeader(self, title):
        """Write the PDF header"""

        ws = self.writestr

        t=time.localtime()
        timestr=str(time.strftime("D:%Y%m%d%H%M%S", t))
        ws("%PDF-1.4\n")
        self._locations[1] = self._fpos
        ws("1 0 obj\n")
        ws("<<\n")

        buf = "".join(("/CreationDate (", timestr, ")\n"))
        ws(buf)
        buf = "".join(("/Producer (", self._appname, "(\\Rawscripts.com 2010))\n"))
        ws(buf)
        

        ws(">>\n")
        ws("endobj\n")
    
        self._locations[2] = self._fpos

        ws("2 0 obj\n")
        ws("<<\n")
        ws("/Type /Catalog\n")
        ws("/Pages 3 0 R\n")
        ws(">>\n")
        ws("endobj\n")
        
        self._locations[4] = self._fpos
        ws("4 0 obj\n")
        ws("<<\n")
        buf = "".join(("/BaseFont ", str(self._font), " /Encoding /WinAnsiEncoding /Name /F1 /Subtype /Type1 /Type /Font >>\n"))
        ws(buf)
    
        if self._IsoEnc:
            ws(ENCODING_STR)
            
        ws(">>\n")
        ws("endobj\n")
        
        self._locations[5] = self._fpos
        
        ws("5 0 obj\n")
        ws("<<\n")
        ws("  /Font << /F1 4 0 R >>\n")
        ws("  /ProcSet [ /PDF /Text ]\n")
        ws(">>\n")
        ws("endobj\n")
    
    def StartPage(self):
        """ Start a page of data """

        ws = self.writestr
        
        self._pageNo += 1
        self._curobj += 1

        self._locations.append(self._fpos)
        self._locations[self._curobj]=self._fpos
    
        self._pageObs.append(self._curobj)
        self._pageObs[self._pageNo] = self._curobj
        
        buf = "".join((str(self._curobj), " 0 obj\n"))

        ws(buf)
        ws("<<\n")
        ws("/Type /Page\n")
        ws("/Parent 3 0 R\n")
        ws("/Resources 5 0 R\n")

        self._curobj += 1
        buf = "".join(("/Contents ", str(self._curobj), " 0 R\n"))
        ws(buf)
        ws(">>\n")
        ws("endobj\n")
        
        self._locations.append(self._fpos)
        self._locations[self._curobj] = self._fpos

        buf = "".join((str(self._curobj), " 0 obj\n"))
        ws(buf)
        ws("<<\n")
        
        buf = "".join(("/Length ", str(self._curobj + 1), " 0 R\n"))
        ws(buf)
        ws(">>\n")
        ws("stream\n")
        strmPos = self._fpos
    
        ws("BT\n");
        buf = "".join(("/F1 ", str(self._ptSize), " Tf\n"))
        ws(buf)
        buf = "".join(("1 0 0 1 50 ", str(self._pageHt - 40), " Tm\n"))
        ws(buf)
        buf = "".join((str(self._vertSpace), " TL\n"))
        ws(buf)
    
        return strmPos

    def EndPage(self, streamStart):
        """End a page of data """
        
        ws = self.writestr

        ws("ET\n")
        streamEnd = self._fpos
        ws("endstream\n")
        ws("endobj\n")
    
        self._curobj += 1
        self._locations.append(self._fpos)
        self._locations[self._curobj] = self._fpos
    
        buf = "".join((str(self._curobj), " 0 obj\n"))
        ws(buf)
        buf = "".join((str(streamEnd - streamStart), '\n'))
        ws(buf)
        ws('endobj\n')
    
    def WritePages(self):
        """Write pages as PDF"""
        
        ws = self.writestr

        beginstream=0
        lineNo, charNo=0,0
        ch, column=0,0
        padding,i=0,0
        atEOF=0
        
        while not atEOF:
            beginstream = self.StartPage()
            column=1
            
            while column <= self._columns:
                column += 1
                atFF=0
                atBOP=0
                lineNo=0
            
                while lineNo < self._lines and not atFF and not atEOF:
                    
                    lineNo += 1
                    ws("(")
                    charNo=0
                    
                    while charNo < self._cols:
                        charNo += 1
                        ch = self._ifs.read(1)
                        cond = ((ch != '\n') and not(ch==FF and self._doFFs) and (ch != ''))
                        if not cond:
                            break

                        if ord(ch) >= 32 and ord(ch) <= 127:
                            if ch == '(' or ch == ')' or ch == '\\':
                                ws("\\")
                            ws(ch)
                        else:
                            if ord(ch) == 9:
                                padding =self._tab - ((charNo - 1) % self._tab)
                                for i in range(padding):
                                    ws(" ")
                                charNo += (padding -1)
                            else:
                                if ch != FF:
                                    # write \xxx form for dodgy character
                                    buf = "".join(('\\', ch))
                                    ws(buf)
                                else:
                                    # dont print anything for a FF
                                    charNo -= 1

                    ws(")'\n")
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
                    ws(buf)

            self.EndPage(beginstream)

    def WriteRest(self):
        """Finish the file"""

        ws = self.writestr
        self._locations[3] = self._fpos
    
        ws("3 0 obj\n")
        ws("<<\n")
        ws("/Type /Pages\n")
        buf = "".join(("/Count ", str(self._pageNo), "\n"))
        ws(buf)
        buf = "".join(("/MediaBox [ 0 0 ", str(self._pageWd), " ", str(self._pageHt), " ]\n"))
        ws(buf)
        ws("/Kids [ ")
    
        for i in range(1, self._pageNo+1):
            buf = "".join((str(self._pageObs[i]), " 0 R "))
            ws(buf)

        ws("]\n")
        ws(">>\n")
        ws("endobj\n")
        
        xref = self._fpos
        ws("xref\n")
        buf = "".join(("0 ", str((self._curobj) + 1), "\n"))
        ws(buf)
        buf = "".join(("0000000000 65535 f ", str(LINE_END)))
        ws(buf)

        for i in range(1, self._curobj + 1):
            val = self._locations[i]
            buf = "".join((string.zfill(str(val), 10), " 00000 n ", str(LINE_END)))
            ws(buf)

        ws("trailer\n")
        ws("<<\n")
        buf = "".join(("/Size ", str(self._curobj + 1), "\n"))
        ws(buf)
        ws("/Root 2 0 R\n")
        ws("/Info 1 0 R\n")
        ws(">>\n")
        
        ws("startxref\n")
        buf = "".join((str(xref), "\n"))
        ws(buf)
        ws("%%EOF\n")
        
    def ShowHelp(self):
        """Show help on this program"""
        
        sys.exit( PROG_HELP % {'progname': self._progname} )

def main():
    
    pdfclass=pyText2Pdf()
    pdfclass.parseArgs()
    pdfclass.Convert()

if __name__ == "__main__":
    main()
## end of http://code.activestate.com/recipes/189858/ }}}

