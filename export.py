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
from reportlab.lib.pagesizes import A4 
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
	widths=[[61,7,1],[61,7,1],[40,32,0],[35,22,1],[35,27,0],[61,61,1]]
	txt = simplejson.loads(data)
	more="                                (MORE)\n"
	cont="(CONT'D)"
	lines=[]
	parenTest=False

	for i in txt:
		w=[]
		words = deque(i[0].split(' '))
		linewidth=0
		line=''
		k=0
		while k<widths[int(i[1])][1]:
			line+=' '
			k+=1
		for j in words:
			if linewidth+len(j)>widths[int(i[1])][0]:
				linewidth=0
				w.append(line.rstrip())
				line=''
				k=0
				while k<widths[int(i[1])][1]:
					line+=' '
					k+=1
			line+=j+' '
			linewidth+=len(j)+1
		w.append(line.rstrip())
		if widths[int(i[1])][2]:
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
			if linecount<54 and linecount+len(lines[i])>57 and txt[i][1]==3:
				char=lines[i-1][0]
				diff =55-linecount
				linecount=len(lines[i])-diff+1
				lines[i].insert(diff, more)
				
				lines[i].insert(diff+1,'                                                                '+str(pageN)+'.')
				pageN+=1
				lines[i].insert(diff+2,'')
				lines[i].insert(diff+3,'')
				lines[i].insert(diff+4, char+" (CONT'D)")
				i+=1
			elif linecount<54 and len(lines[i])>4 and linecount+len(lines[i])==57 and txt[i][1]==3:
				char=lines[i-1][0]
				diff=len(lines[i])-3
				lines[i].insert(diff, more)
				lines[i].insert(diff+1,'')
				#if diff!=0:
				#  lines[i].insert(diff+1,'')
				#  diff+=1
				lines[i].insert(diff+2,'                                                                '+str(pageN)+'.')
				pageN+=1
				lines[i].insert(diff+3,'')
				lines[i].insert(diff+4,'')
				lines[i].insert(diff+5, char+" (CONT'D)")
				linecount=4
				i+=1
			elif linecount<55 and linecount+len(lines[i])>57 and txt[i][1]==1:
				diff=55-linecount
				linecount=len(lines[i])-diff
				lines[i].insert(diff,'')
				lines[i].insert(diff+1,'')
				lines[i].insert(diff+2,'                                                                 '+str(pageN)+'.')
				pageN+=1
				lines[i].insert(diff+3,'')
				lines[i].insert(diff+4,'')
				i+=1
			elif linecount<55 and len(lines[i])>4 and txt[i][1]==1:
				diff=len(lines[i])-3
				lines[i].insert(diff,'')
				lines[i].insert(diff+1,'')
				lines[i].insert(diff+2,'')
				lines[i].insert(diff+3,'                                                                 '+str(pageN)+'.')
				pageN+=1
				lines[i].insert(diff+4,'')
				lines[i].insert(diff+5,'')
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
	#lines[0].insert(0,'') # Keep changing the sizes in the pdfs. This looks best.

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
	
	
	buffer = StringIO.StringIO()
	c = canvas.Canvas(buffer, pagesize = A4)
	c.setFont('Courier',12)
	
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
		
		ty = 700 #title y
		ay = 300 #address y
		ax = 200 #address x
		lh = 16 # lineheight
		style = getSampleStyleSheet()["Normal"]
		style.fontName = 'Courier'
		p = Paragraph("<para alignment='center'><u>"+r.title+"</u></para>", style) 
		p.wrap(100, 100) 
		p.drawOn(c, 300, ty)
		ty-=lh*2
		c.drawCentredString(300,ty,'Written')
		ty-=lh
		c.drawCentredString(300,ty,'by')
		ty-=lh*2
		c.drawCentredString(300,ty,r.authorOne)
		c.showPage() 
		c.save()
	

	return buffer
