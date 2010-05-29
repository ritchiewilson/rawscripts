import StringIO
import re

def exportToText(data):
  txt = data
  headless = txt.split('</div>')[1]
  content = headless.split('</body>')[0]
  content = content.replace("\n", "")
  #content = content.replace("\r\n", "")
  content = content.replace('<br>', '')
  content = content.replace('<hr class=pb>', '')
  pattern = re.compile(r'<span class=notes .*</span>')
  content = re.sub(pattern, '', content)
  content = content.replace(""" (CONT'D)""", "")
  content = content.replace("""<h3 class=more>""", "")
  content = content.replace("""(MORE)""", "")
  content = content.replace("&nbsp;", "")
  content = content.replace("""  """, "")
  content = content.replace("""<h3 class=sm>""", "")
  #Get rid of all the closing tags
  content = content.replace("</h1>", "</p>")
  content = content.replace("</h2>", "</p>")
  content = content.replace("</h3>", "</p>")
  content = content.replace("</h4>", "</p>")
  content = content.replace("</h5>", "</p>")
  content = content.replace("</h6>", "</p>")
  script = ""
  linelist = content.splitlines()
  content = "".join(linelist)
  parts = content.split("</p>")
  # Set correct spaces
  fourteen = """               """
  fortytwo = """                                          """
  thirty = """                              """
  twentynine = """                            """
  thirtyseven = """                                     """
  newfile = StringIO.StringIO()
  
  i=0
  while i<len(parts):
      pattern = re.compile(r'<h.*>')
      try:
          junk = parts[i][3]
          more = False
      except:
          more = True
      if more == False:
          #Character
          if parts[i][2] == '3':
              character = fortytwo + re.sub(pattern,'',parts[i]).upper() + "\n"
              newfile.write(character)
          #Dialouge
          if parts[i][2] =='4':
              text = parts[i].split(">", 1)[1]
              words = text.split(" ")
              newfile.write(twentynine)
              j=0
              linelength = 0
              while j<len(words):
                  if linelength + len(words[j]) > 35:
                      newfile.write('\n' + twentynine)
                      linelength = 0
                  else:
                      newfile.write(" " + words[j])
                      linelength = linelength +1 + len(words[j])
                      j=j+1
              newfile.write('\n\n')
          #Scene haeadign
          if parts[i][2] =='1':
              text = parts[i].split(">", 1)[1]
              newfile.write(fourteen + " " +text.upper() + "\n\n")
          #parentcheical
          if parts[i][2] == '6':
              newfile.write(re.sub(pattern, thirtyseven, parts[i]) + "\n")
          #Action
          if parts[i][2] == '2':
              text = parts[i].split(">", 1)[1]
            
              words = text.split(" ")
              newfile.write(fourteen)
              j=0
              linelength = 0
              while j<len(words):
                  if linelength + len(words[j]) > 61:
                      newfile.write('\n' + fourteen)
                      linelength = 0
                  else:
                      newfile.write(" " + words[j])
                      linelength = linelength +1 + len(words[j])
                      j=j+1
              newfile.write('\n\n')
          #Transition
          if parts[i][2]=='5':
            pn = parts[i].split('=')
            if len(pn)<2:
              text = parts[i].split(">", 1)[1]
              spaces = 75-len(text)
              k=0
              while k<spaces:
                  newfile.write(" ")
                  k=k+1
              newfile.write(text.upper() + "\n\n")
      i=i+1

  
  return newfile
