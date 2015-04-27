# Rawscripts - Screenwriting Software
# Copyright (C) Ritchie Wilson
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import StringIO
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.rl_config import defaultPageSize
import reportlab

def wrap_text(text, max_chars):
    words = text.split(' ')
    phrase_array = []
    last_phrase = ''
    for i, word in enumerate(words):
        measure = len(last_phrase + " " + word)
        if measure < max_chars:
            last_phrase += word + " "
        else:
            phrase_array.append(last_phrase[0:-1])
            last_phrase = word +' '
        if i + 1 == len(words):
            phrase_array.append(last_phrase[0:-1])
            break
    return phrase_array

def Text(data, title_page_obj):
    widths=[[62,15,1],[62,15,1],[40,35,0],[36,25,1],[35,30,0],[62,61,1]]
    txt = data

    s = StringIO.StringIO()

    if title_page_obj is not None:
        r = title_page_obj

        def center_text(s, text):
            spaces = (80 - len(text)) / 2
            s.write(' ' * spaces)
            s.write(text)
            s.write('\n')
            return s

        s.write("\n" * 25)
        s = center_text(s, r.title)
        s.write("\n\n")

        s.write("                                   Written by\n\n\n")
        s = center_text(s, r.authorOne)
        if r.authorTwoChecked=="checked":
            s = center_text(s, r.authorTwo)
        if r.authorThreeChecked=="checked":
            s = center_text(s, r.authorThree)
        if r.based_onChecked=="checked":
            lines = r.based_on.split("LINEBREAK")
            for line in lines:
                s = center_text(s, line)

        line_breaks = s.getvalue().count('\n')
        s.write('\n' * (39 - line_breaks))

        if r.addressChecked=="checked":
            lines = r.address.split("LINEBREAK")
            for line in lines:
                s.write(line + "\n")
        s.write("\n\n")
        if r.phoneChecked == "checked":
            s.write(r.phone + "\n")
        if r.cellChecked == "checked":
            s.write(r.cell + "\n")
        s.write("\n")
        if r.emailChecked == "checked":
            s.write(r.email + "\n")
        s.write("\n")
        if r.registeredChecked == "checked":
            s.write(r.registered + "\n")
        s.write("\n\n")
        if r.otherChecked == "checked":
            s.write(r.other + "\n")

        line_breaks = s.getvalue().count('\n')
        s.write('\n' * (64 - line_breaks))

    s.write('\n\n\n')
    parenTest=False
    for i in txt:
        text, line_format = i[0], int(i[1])
        #lingering parentheses problem
        if parenTest == True:
            if not line_format == 4:
                    s.write('\n')
            parenTest=False

        if line_format in [0, 2, 5]:
            text = text.upper()

        max_chars = widths[line_format][0]
        phraseArray = wrap_text(text, max_chars)
        for phrase in phraseArray:
            spaces = widths[line_format][1]
            if line_format == 5:
                spaces = 76 - len(phrase)
            s.write(' ' * spaces)
            s.write(phrase)
            s.write('\n')

        #save paren for next time around to be sure
        if line_format == 3:
            parenTest = True
        elif widths[line_format][2] == 1:
            s.write('\n')
    return s

def Pdf(data, title_page_obj):
    buffer = StringIO.StringIO()
    c = canvas.Canvas(buffer)
    c.setFont('Courier',11)
    lh=12

    if title_page_obj is not None:
        r = title_page_obj

        ty = 600 #title y
        tx = defaultPageSize[0]/2.0 #title x (center)
        ay = 250 #address y
        ax = 120 #address x
        style = getSampleStyleSheet()["Normal"]
        style.fontName = 'Courier'
        style.fontSize = 11
        p = Paragraph("<para alignment='center'><u>"+r.title+"</u></para>", style)
        w,h = p.wrap(170, 100)
        p.drawOn(c, tx-(w/2.0), ty)
        ty-=lh*2
        c.drawCentredString(tx,ty,'Written')
        ty-=lh
        c.drawCentredString(tx,ty,'by')
        ty-=lh*2
        c.drawCentredString(tx,ty,r.authorOne)
        ty-=lh
        if r.authorTwoChecked=='checked':
            c.drawCentredString(tx, ty, r.authorTwo)
            ty-=lh
        if r.authorThreeChecked=='checked':
            c.drawCentredString(tx, ty, r.authorThree)
            ty-=lh
        if r.based_onChecked=='checked':
            ty-=(lh*2)
            parts = r.based_on.split('LINEBREAK')
            for i in parts:
                c.drawCentredString(tx, ty, i)
                ty-=lh

        if r.addressChecked=='checked':
            parts = r.address.split('LINEBREAK')
            for i in parts:
                c.drawString(ax, ay, i)
                ay-=lh

        if r.phoneChecked=='checked':
            c.drawString(ax, ay, r.phone)
            ay-=lh
        if r.cellChecked=='checked':
            c.drawString(ax, ay, r.cell)
            ay-=lh
        if r.emailChecked=='checked':
            c.drawString(ax, ay, r.email)
            ay-=lh
        if r.registeredChecked=='checked':
            c.drawString(ax, ay, r.registered)
            ay-=lh
        if r.otherChecked=='checked':
            c.drawString(ax, ay, r.other)
            ay-=lh

        c.showPage()

    # Calc wrapping text
    # end up with an array linesNLB
    # just like the var in js
    widths = [62, 62, 40, 36, 30, 62]
    b_space = [1, 1, 0, 1, 0, 1]
    printX = [100, 100, 232, 166, 199, 503]
    lines = data

    j = 0 ## dumb iterator. used to handle mutiple parentheticals in one dialog
    lc = '' # keep track of recenct character to speak for CONT'D
    linesNLB = []
    for i in lines:
        text, line_format = i[0], int(i[1])

        if line_format in [0, 2, 5]:
            text = text.upper()

        max_chars = widths[line_format]
        phraseArray = wrap_text(text, max_chars)

        if line_format == 2 and phraseArray[-1] == lc:
            phraseArray[-1] += " (CONT'D)"

        # add blank lines
        for i in range(b_space[line_format]):
            phraseArray.append('')

        if line_format == 4 and j != 0 and lines[j-1][1] == 3:
            linesNLB[j-1].pop()
        linesNLB.append(phraseArray)
        j += 1
        if line_format == 2:
            lc = text.upper()
        elif line_format == 0:
            lc = ''

    #pagination, as done in
    # editor.js
    pageBreaks = []
    i=0
    r=0
    trip=False
    while i<len(lines):
        lineCount = r
        while lineCount+len(linesNLB[i])<56:
            lineCount+=len(linesNLB[i])
            i+=1
            if i==len(lines):
                trip=True
                break
        if trip==True:
            break

        s=0
        r=0
        if lines[i][1]==3 and lineCount<54 and lineCount+len(linesNLB[i])>57:
            s=55-lineCount
            r=1-s
            lineCount=56
        elif lines[i][1]==3 and lineCount<54 and len(linesNLB[i])>4:
            s=len(linesNLB[i])-3
            r=1-s
            lineCount=55
        elif lines[i][1]==1 and lineCount<55 and lineCount+len(linesNLB[i])>57:
            s=55-lineCount
            r=1-s
            lineCount=56
        elif lines[i][1]==1 and lineCount<55 and len(linesNLB[i])>4:
            s=len(linesNLB[i])-3
            r=1-s
            lineCount=55
        else:
            while lines[i-1][1]==0 or lines[i-1][1]==2 or lines[i-1][1]==4:
                i-=1
                lineCount-=len(linesNLB[i])

        pageBreaks.append([i, lineCount, s])




    # draw text onto pdf, just like
    # it's done in editor.js
    pageStartY = 740
    y=pageStartY
    numX=483
    numY= pageStartY+(lh*3)
    count=0
    latestCharacter=''
    c.setFont('Courier',11)
    for i in range(0,len(linesNLB)):
        if lines[i][1]==2:
            latestCharacter=lines[i][0]
        for j in range(0,len(linesNLB[i])):
            if len(pageBreaks)!=0 and pageBreaks[count][0]==i and pageBreaks[count][2]==j:
                if j!=0 and lines[i][1]==3:
                    c.drawString(printX[2], y, "(MORE)")
                if count!=0:
                    c.drawRightString(numX,numY, str(count+1)+'.')
                c.showPage()
                c.setFont('Courier',11)
                y=pageStartY
                count+=1
                if j!=0 and lines[i][1]==3:
                    c.drawString(printX[2], y, latestCharacter.upper()+" (CONT'D)")
                    y-=lh
                if count>=len(pageBreaks):
                    count=len(pageBreaks)-2
            if lines[i][1]==5:
                c.drawRightString(printX[int(lines[i][1])], y, linesNLB[i][j])
            else:
                c.drawString(printX[int(lines[i][1])], y, linesNLB[i][j])
            y-=lh

    #close last page
    if len(pageBreaks)!=0:
        c.drawRightString(numX,numY, str(len(pageBreaks)+1)+'.')
    c.showPage()
    c.save()

    return buffer
