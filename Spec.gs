function getSpec() {
  
  //現在のスプレッドシートを取得
  var aBook = SpreadsheetApp.getActiveSpreadsheet();
  
  //"価格表"シートを取得
  var aSheet = aBook.getSheetByName("比較表");
  
  //"価格表"シートの最終行を取得
  var lastColumn = aSheet.getDataRange().getLastColumn()
   
   
  //2行目から最終行までループ
  for (var i = 2; i <= lastColumn; i++) {
  //既にデータのある行は飛ばす（メーカー名に値が入力されているかで判断）
  　　for (var j=2; j<= lastColumn; j++){
    　　Logger.log(!aSheet.getRange(4,j).getValue());
    　　if(!aSheet.getRange(4,j).getValue()){
    　　break;
    　　}
      i++
  }
    
    Logger.log(i);
    //3列目のi行のURLを取得
    var url = aSheet.getRange(3, i).getValue();
    
    //処理を1秒待つ
    Utilities.sleep(1000);
    
    //URLページを取得
    try{
      var response = UrlFetchApp.fetch(url);
       }
    catch(e){
      break;
    }
    
    //HTML文を取得
      var html = response.getContentText('shift_jis');
      
    //h2タグから商品名を取得
    var itemName = getContentOfTagName(html, 'h2');
    
    //mkrnameからメーカー名を取得
    var re1 = /mkrname: '([\s\S]*?)\'/;
    var mkrName = html.match(re1)[1];
    Logger.log(mkrName);
    
    //商品詳細取得のために<li>タグを格納
    var abstX = Parser.data(html).from('<ul class="itemviewDetailList">').to('</ul>').build();
    //<li>タグが邪魔なのでsplitで分割
    var abst = abstX.split("<li>")
    
    //正規表現で最安値を取得
    // <span>&yen;の後に数字とカンマが1つ以上続く条件で検索。
    var re2 = new RegExp("\<span\>\&yen\;([0-9,]+)");
    
    //マッチした()内の数字を取得
    var price = html.match(re2)[1];
    
    //商品名をセルに書き込む
    aSheet.getRange(6, i).setValue(itemName[0]);
    
    //メーカーをセルに書き込む
    aSheet.getRange(4, i).setValue(mkrName);
    
    //価格をセルに書き込む
    aSheet.getRange(7, i).setValue(price);
    
    
    //この辺はやりたい製品によってローカライズ必要
    //h3タグ{スペックの場所}の始まりからhtmlを分割.
    var sphtml=html.split('<div class="h3Area">')
    //tdタグを取得{ここがスペックに当たる}
    var spec=sphtml[1].match(/<td(?: .+?)?>.*?<\/td>/g)
    
    //スペックをセルに書き込む
    var aRange=aSheet.getRange(1,2)
    var specnum=aRange.getValue()
    
    //specが始まる行を取得
    var aRange1=aSheet.getRange(1,4)
    var x=aRange1.getValue()
   
    for (var k=x; k<specnum+x; k++){
      //書き込むときにhtmlタグを削除　この部分→replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'')
      aSheet.getRange(k, i).setValue(spec[k-x].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,''));
    }
    
    //商品詳細をセルに書き込む。
    aSheet.getRange(k, i).setValue(abst[1].slice(0,-7));
    aSheet.getRange(k+1, i).setValue(abst[2].slice(0,-7));
    aSheet.getRange(k+2, i).setValue(abst[3].slice(0,-7)); 
    
    //発売日を取得
    var date = Parser.data(sphtml[0]).from('<span class="date">').to('</span>').build();
    //データを発売日/登録日と日付をsplitで分割
    var spdate= date.split('：');
    aSheet.getRange(k+3, i).setValue(spdate[0]); 
    aSheet.getRange(k+4, i).setValue(spdate[1]); 
    
    //データを入力した日付を書き込む
    var today = new Date()
    aSheet.getRange(k+5, i).setValue(today); 
  }
}
 
function getContentOfTagName(html, tagName) {
  
  var i = 0;
  var j = 0;
  var startOfTag;
  var endOfTag;
  var str = [ ];
  
  while(html.indexOf('<' + tagName,j)!=-1){
    
    //"<タグ名"の開始位置を取得
    j = html.indexOf('<' + tagName,j);
    
    //次の">"位置 + 1を文字列の始めとする
    startOfStr = html.indexOf('>',j)+1;
    
    //次の"</タグ名>"位置を文字列の終わりとする
    endOfStr = html.indexOf('</' + tagName + '>',j);
    
    //タグの間の文字列を配列に追加
    str[i] = html.substring(startOfStr, endOfStr);
    
    j = endOfStr + 1;
    i++;
  }
  
  return str;
}