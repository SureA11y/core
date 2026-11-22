import sys,re
# pick.py diff keyword... : keep hunks containing any keyword
src=open(sys.argv[1]).read()
keys=sys.argv[2:]
head,_,rest=src.partition('\n@@')
hunks=['@@'+h for h in ('\n@@'+rest).split('\n@@')[1:]]
out=[head]+[h for h in hunks if any(k in h for k in keys)]
sys.stdout.write('\n'.join(x.rstrip('\n') for x in out)+'\n')
