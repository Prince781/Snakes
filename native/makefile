# makefile

# compiler and compiler flag variables
JFLAGS = -g
JC = javac

# a custom macro to clean up some things

# clear default definitions for these targets
.SUFFIXES: .java .class

# Here is our target entry for creating .class files from .java files 
# This is a target entry that uses the suffix rule syntax:
#	DSTS:
#		rule
#  'TS' is the suffix of the target file, 'DS' is the suffix of the dependency 
#  file, and 'rule'  is the rule for building a target	
# '$*' is a built-in macro that gets the basename of the current target 
# Remember that there must be a < tab > before the command line ('rule') 
.java.class:
	$(JC) $(JFLAGS) $*.java

# this is a macro that adds more classes for compilation
CLASSES = \
	src/SnakesGame.java

# default make target entry
default: classes; \
	if [ ! -e build ]; then mkdir build; fi; \
	rm -f build/*.class; find . -name "*.class" -exec mv -if {} -t build \;

# This target entry uses Suffix Replacement within a macro: 
# $(name:string1=string2)
# 	In the words in the macro named 'name' replace 'string1' with 'string2'
# Below we are replacing the suffix .java of all words in the macro CLASSES 
# with the .class suffix
classes: $(CLASSES:.java=.class)

# RM is a predefined macro in make (RM = rm -f)
clean:
	$(RM) build/*.class
