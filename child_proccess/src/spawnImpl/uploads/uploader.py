import sys
import json
from urllib import request

# '{"path":"my-data.csv","url":"http://localhost:3000"}'

# do request to server running in localhost
def main():
    item = json.loads(sys.argv[1] )
    
    url = item.get('url')
    path = item.get('path')
    
    print('URL >> ',url)
    print('PATH >>',path)
       
    data = open(path,'rb').read()
    
    req = request.Request(url,data)
    
    respData = request.urlopen(req).read().decode('utf-8')
    
    print(respData)
    
if __name__ == '__main__':
    main()