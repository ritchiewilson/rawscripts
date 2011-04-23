from django.utils import simplejson
import StringIO
from collections import deque
import sys, os
import string
import time
import logging
from google.appengine.ext import db
from google.appengine.api import users
import sys
sys.path.insert(0, 'reportlab.zip')
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph 
from reportlab.lib.styles import getSampleStyleSheet 
from reportlab.rl_config import defaultPageSize
import reportlab
folderFonts = os.path.dirname(reportlab.__file__) + os.sep + 'fonts'

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
					if not int(i[1])==4:
							s.write('\n')
					parenTest=False
			
			words = deque(i[0].split(' '))
			if not int(i[1])==5:
					spaces=widths[int(i[1])][1]
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
					if linewidth+len(j)>widths[int(i[1])][0]:
							linewidth=0
							s.write('\n')
							k=0
							while k<widths[int(i[1])][1]:
									s.write(' ')
									k+=1
					if int(i[1])==0:
							v=j.upper()
					elif int(i[1])==2:
							v=j.upper()
					elif int(i[1])==5:
							v=j.upper()
					else:
							v=j
					s.write(v)
					s.write(' ')
					linewidth+=len(j)+1
			s.write('\n')
			#save paren for next time around to be sure
			if int(i[1])==3:
					parenTest=True
			elif widths[int(i[1])][2]==1:
					s.write('\n')
		
	return s

def Pdf(data, title, title_page, resource_id):
	buffer = StringIO.StringIO()
	c = canvas.Canvas(buffer)
	c.setFont('Courier',11)
	lh=12
	
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
	widths=[62,62,40,36,30,62]
	b_space=[1,1,0,1,0,1]
	printX=[100,100,232,166,199,503]
	lines = simplejson.loads(data)
	
	j=0 ## dumb iterator. used to handle mutiple parentheticals in one dialog
	linesNLB=[]
	for i in lines:
		wa=i[0].split(' ')
		phraseArray=[]
		lastPhrase=''
		l=widths[int(i[1])]
		measure=0
		itr=0
		
		# test if should be uppercase
		if i[1]==0 or i[1]==2 or i[1]==5:
			uc=True
		else:
			uc=False
		for w in wa:
			itr+=1
			measure=len(lastPhrase+" "+w)
			if measure<l:
				lastPhrase+=w+" "
			else:
				if uc:
					lastPhrase=lastPhrase.upper()
				phraseArray.append(lastPhrase[0:-1])
				lastPhrase=w+' '
			if itr==len(wa):
				if uc:
					lastPhrase=lastPhrase.upper()
				phraseArray.append(lastPhrase[0:-1])
				break
		itr=0
		while itr<b_space[int(i[1])]:
			phraseArray.append('')
			itr+=1
		if i[1]==4 and j!=0 and lines[j-1][1]==3:
			linesNLB[j-1].pop()
		linesNLB.append(phraseArray)
		j+=1
	
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
	pageStartY = 730
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