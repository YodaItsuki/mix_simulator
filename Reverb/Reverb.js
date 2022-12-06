class seigyo{ //audiocontextとボリュームのノードとエフェクターのノードのクラス
  constructor(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,wetgainnode,drygainnode,preset_temp,preset_name){
    this.audioCtx = audioCtx;
    this.gainNode = gainNode;
    this.effectnode = effectnode;
    this.Pannode = Pannode;
    this.wetgainnode = wetgainnode;
    this.drygainnode = drygainnode;
    this.analyserNode_before = analyserNode_before;
    this.analyserNode_after = analyserNode_after;
    this.name = preset_name;
    if(preset_temp != undefined){
      this.effect_temp = preset_temp; //パラメーターの値を保存する変数 エフェクトオンオフの時に使う 0wet 1dry
    }
    else{
      this.effect_temp = [0.1,1]; //パラメーターの値を保存する変数 エフェクトオンオフの時に使う 0wet 1dry
    }
  }

  touroku(element,sentaku){
    this.audio = element.querySelector('#audio');
    this.filesousin = element.querySelector('#filesousin');
    this.kirikae = element.querySelector('#kirikae');
    this.effect_switch = element.querySelector('#effect_switch');
    this.mute_button = element.querySelector('#mute');
    this.solo_button = element.querySelector('#solo');
    this.reset_button = element.querySelector('#reset');
    this.audio_name = element.querySelector('#audio_name');
    this.select_mark = element.querySelector('#select_mark'); //現在選択している音源のマークの表示
    this.select_mark.style.color = "red";
    this.volume_temp = 1; //ボリュームの値の一時保存の変数　ミュートとソロの時に使う
    this.mute_flag = false; //ミュートの判定のフラグ
    this.solo_flag = false; //ソロの判定のフラグ
    this.filesousin.addEventListener( 'change', () => { //ファイルを選択した時の動作
      this.reader = new FileReader();
      this.file = this.filesousin.files[0];
      this.url;
      this.reader.onload = () => {
        this.url = this.reader.result;
        this.sousin(this.url);
      };
      this.reader.readAsDataURL(this.file);
    } );
    this.kirikae.addEventListener( 'click', () => {this.kirikaeru()} );
    this.effect_switch.addEventListener( 'click', () => {this.switch()} );
    this.mute_button.addEventListener( 'click', () => {this.mute()} );
    this.solo_button.addEventListener( 'click', () => {this.solo()} );
    this.reset_button.addEventListener( 'click', () => {this.reset()} );
    this.sentaku = sentaku; //配列内の何番目のインスタンスなのか
    this.sousakinshi = false; //エフェクターが操作禁止かどうかを判定する変数 falseが操作できる trueが操作不可
    this.effectnode.then(
      function onFulfilled(value){
        this.effectnode = value;
        this.sousin();
      }.bind(this),
    
      // 失敗時に呼び出される
      function onRejected(reason){
        console.log(reason);
      }.bind(this)
    );
  }

  sousin(url) { //ファイルを選択したときの動作 audioタグのsrcに入れて各ノードを接続
    for(var i = 0; i < audio.length; i++){ //一旦すべてのトラックの再生を停止して、再生位置を一番最初に戻す
      audio[i].pause();
      audio[i].currentTime = 0; 
    }
    this.audio_name.textContent = this.name;
    sentaku_audio.textContent = seigyo_elements[sentaku].name;
    douji.value = "再生";
    saisei_flag = false;
    if(url != undefined){
      this.audio.src = url;
    }
    if(this.source == null){
      this.source = this.audioCtx.createMediaElementSource(this.audio); //ノード作成
    }
    //ノードの接続 入力→ボリューム→パン→エフェクター→出力
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.Pannode);
    this.Pannode.connect(this.effectnode);
    this.effectnode.connect(this.wetgainnode);
    this.wetgainnode.connect(this.audioCtx.destination);
    //ここまでwetの音

    this.Pannode.connect(this.drygainnode);
    this.drygainnode.connect(this.audioCtx.destination);
    //ここまでdryの音

    this.gainNode.connect(this.analyserNode_before); //エフェクトをかける前のアナライザー
    this.effectnode.connect(this.analyserNode_after); //エフェクトをかけた後のアナライザー
    if(douji.disabled == true){ //再生が操作不可の時の動作
      douji.disabled = false; //再生をボタンを押せるようにする
      saiseiichi.disabled = false; //再生位置を調整できるようにする
      setTimeout(function(){ //音源の再生時間を読み込めるように少し遅延をかける
        saiseiichi.max = this.audio.duration;
        for(var i = 0 ; i < audio.length ; i++){
          if(saiseiichi.max == audio[i].duration){
            max_audio = i; //一番再生時間が長い音源が何番目なのかの変数
          }
        }
      }.bind(this),200);
    }
    else{
      setTimeout(function(){
        if(saiseiichi.max < this.audio.duration){ //もし読み込んだ音源が再生位置のスライダーの最大の値を超えた場合
          saiseiichi.max = this.audio.duration //再生位置のスライダーの最大の値変える
        }
        for(var i = 0 ; i < audio.length ; i++){
          if(saiseiichi.max == audio[i].duration){ //すべての音源と比較して読み込んだ音源の時間が一番長いときの動作
            max_audio = i;
          }
        }
      }.bind(this),200);
    }
  }

  switch(){ //Bypassを押したときの動作
    if(this.sousakinshi == false){ //エフェクトオフ・オンのボタンがエフェクトオフの時
      this.wetgainnode.gain.value = 0;
      this.drygainnode.gain.value = 1;
      if(this.sentaku == sentaku){ //エフェクトを適応する音源を選択して、その選択中の音源のエフェクトをオンオフするときだけ変更する
        effect_set.wet_gain.disabled = true; //スライダーを操作不能にする
        effect_set.dry_gain.disabled = true;
      }
      this.sousakinshi = true; //エフェクターが操作できるかどうかのフラグをtrueにする
      this.effect_switch.style.backgroundColor = "red";
      this.effect_switch.style.color = "white";
    }
    else if(this.sousakinshi == true){ //エフェクトオフ・オンのボタンがエフェクトオンの時
      this.wetgainnode.gain.value = this.effect_temp[0];
      this.drygainnode.gain.value = this.effect_temp[1];
      if(this.sentaku == sentaku){
        effect_set.wet_gain.disabled = false; //スライダーを操作できるようにする
        effect_set.dry_gain.disabled = false;
      }
      this.sousakinshi = false; //エフェクターが操作できるかどうかのフラグをfalseにする
      this.effect_switch.style.backgroundColor = "#F0F0F0";
      this.effect_switch.style.color = "black";
    }
  }

  kirikaeru() { //切り替えを押したときの動作
    seigyo_elements[sentaku].select_mark.textContent = "";
    sentaku = this.sentaku; //どれを操作しているかをこのインスタンスの配列の番号にする
    //各エフェクターの値をその音源の値にする
    this.select_mark.textContent = "●";
    volume.value = this.volume_temp;
    pan.value = this.Pannode.pan.value;
    effect_set.wet_gain.value = this.effect_temp[0];
    effect_set.dry_gain.value = this.effect_temp[1];
    effect_set.wet_gain_view.textContent = this.effect_temp[0];
    effect_set.dry_gain_view.textContent = this.effect_temp[1];
    if(this.sousakinshi == false){
      effect_set.wet_gain.disabled = false; //スライダーを操作できるようにする
      effect_set.dry_gain.disabled = false;
    }
    else{
      effect_set.wet_gain.disabled = true; //スライダーを操作不能にする
      effect_set.dry_gain.disabled = true;
    }
    if(this.mute_flag == true){ //ミュートかどうかを判定するフラグがtrueの時
      volume.disabled = true; //ボリュームを操作不可にする
      volume.value = this.volume_temp; //一時保存したボリュームの値を表示するようにする
    }
    else{
      volume.disabled = false; //ボリュームを操作できるようにする
    }
  }

  mute(){ //ミュートが押されたときの動作
    if(this.mute_flag == false){
      this.gainNode.gain.value = 0; //ボリュームの値を0にする
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = true;
      }
      this.mute_button.style.backgroundColor = "red";
      this.mute_button.style.color = "white";
      this.mute_flag = true; //ミュートしてるかどうかのフラグをtrueに変える
    }
    else{
      this.gainNode.gain.value = this.volume_temp; //一時保存していたボリュームの値を戻す
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = false;
      }
      this.mute_button.style.backgroundColor = "#F0F0F0";
      this.mute_button.style.color = "black";
      this.mute_flag = false; //フラグをfalseに変える
    }
  }

  solo(){ //ソロが押されたときの動作
    if(this.solo_flag == false){ //ソロを判定するフラグがfalseの時
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          seigyo_elements[i].gainNode.gain.value = 0; //iの音源のボリュームを0にする
          seigyo_elements[i].mute_button.disabled = true; //iの音源のミュートのボタンを操作不可にする
          seigyo_elements[i].solo_button.disabled = true; //iの音源のソロのボタンを操作不可にする
        }
      }
      this.solo_button.style.backgroundColor = "red";
      this.solo_button.style.color = "white";
      this.solo_flag = true; //ソロを判定するフラグをtrueに変える
    }
    else{
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          if(seigyo_elements[i].mute_flag == true){ //iの音源がミュートになっている場合
            seigyo_elements[i].gainNode.gain.value = 0; //iの音源を0にする
          }
          else{ //iの音源がミュートではない場合
            seigyo_elements[i].gainNode.gain.value = seigyo_elements[i].volume_temp; //一時保存していたボリュームを戻す
          }
          seigyo_elements[i].mute_button.disabled = false; //iの音源のミュートのボタンを操作できるようにする
          seigyo_elements[i].solo_button.disabled = false;//iの音源のソロのボタンを操作できるようにする
        }
      }
      this.solo_button.style.backgroundColor = "#F0F0F0";
      this.solo_button.style.color = "black";
      this.solo_flag = false; //ソロを判定するフラグをfalseにする
    }
  }
}

class effectset{ //エフェクトを操作するクラス
  constructor(){
    this.wet_gain = document.querySelector('#wet_gain');
    this.dry_gain = document.querySelector('#dry_gain');
    this.wet_gain_view = document.querySelector('#wet_gain_view'); //スレショルドの値の表示
    this.dry_gain_view = document.querySelector('#dry_gain_view'); //スレショルドの値の表示
    this.wet_gain.addEventListener( 'input', () => {this.wet_gainset()} ); //スレショルドのスライダーを動かしたときの動作
    this.dry_gain.addEventListener( 'input', () => {this.dry_gainset()} );
    this.sentaku = 0; //エフェクターを適応する音源の選択、デフォルトで一つ目の音源が選択されている
    this.wet_gain.value = seigyo_elements[0].effect_temp[0]; //プリセットに書き換える
    this.wet_gain_view.textContent = seigyo_elements[0].effect_temp[0];
    this.dry_gain.value = seigyo_elements[0].effect_temp[1];
    this.dry_gain_view.textContent = seigyo_elements[0].effect_temp[1];
  }

  wet_gainset() {
    seigyo_elements[sentaku].wetgainnode.gain.value = this.wet_gain.value; //コンプのスレショルドを書き換える
    this.wet_gain_view.textContent = this.wet_gain.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[0] = this.wet_gain.value; 
    this.wet_gain_view.textContent = this.wet_gain.value;
  }

  dry_gainset(){
    seigyo_elements[sentaku].drygainnode.gain.value = this.dry_gain.value; //コンプのスレショルドを書き換える
    this.dry_gain_view.textContent = this.dry_gain.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[1] = this.dry_gain.value;
    this.dry_gain_view.textContent = this.dry_gain.value;
  }
}

//ここまでクラス

var audio = []
var douji = document.querySelector('#douji');
var saiseijikan = document.querySelector('#saiseijikan');
var max_audio; //一番再生時間が長い音源の要素の場所
var saisei_flag; //再生してるかどうかを判定するフラグ
for( let element of document.querySelectorAll('.seigyo') ) {
  audio.push(element.querySelector('#audio'));
}
douji.addEventListener('click', function( event ) { //再生のボタンを押したときの動作
  if(douji.value == "再生"){
    for(var i = 0; i < audio.length; i++){
      audio[i].play();
    }
    audio[max_audio].addEventListener('timeupdate', function( event ){
      if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
        var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
      }
      else{
        var sec = Math.floor(audio[max_audio].currentTime % 60);
      }
      var min = Math.floor(audio[max_audio].currentTime / 60);
      saiseijikan.textContent = min + ":" + sec;
      saiseiichi.value = audio[max_audio].currentTime;

    }, true);
    saisei_flag = true;
    douji.value = "停止";
  }
  else{
    for(var i = 0; i < audio.length; i++){
      audio[i].pause();
    }
    saisei_flag = false;
    douji.value = "再生";
  }
});

var saiseiichi = document.querySelector('#saiseiichi');
saiseiichi.addEventListener('input', function( event ) { //再生位置のスライダーを動かしたときの動作
  for(var i = 0; i < audio.length; i++){
    if(audio[i].duration > saiseiichi.value){
      audio[i].currentTime = saiseiichi.value;
      if(saisei_flag == true){
        audio[i].play();
      }
    }
  }
  if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
    var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
  }
  else{
    var sec = Math.floor(audio[max_audio].currentTime % 60);
  }
  var min = Math.floor(audio[max_audio].currentTime / 60);
  saiseijikan.textContent = min + ":" + sec;
  saiseiichi.value = audio[max_audio].currentTime;
});

var volume = document.querySelector('#volume');
var volumedb = document.querySelector('#volumedb');
volume.addEventListener('input', function( event ) { //volumeのスライダーを動かしたときの動作
  seigyo_elements[sentaku].gainNode.gain.value = volume.value;
  seigyo_elements[sentaku].volume_temp = volume.value; //ボリュームの値の一時保存 ミュートとソロの時に使う
  volumedb.textContent = Math.round(volume.value * 100);
});

var pan = document.querySelector('#pan');
var direction = document.querySelector('#direction');
pan.addEventListener('input', function( event ) { //panのスライダーを動かしたときの動作
  seigyo_elements[sentaku].Pannode.pan.value = pan.value;
  if(pan.value == 0){
    direction.textContent = "C";
  }
  else if(pan.value < 0){
    direction.textContent = "L" + Math.round(Math.abs(pan.value) * 100);
  }
  else{
    direction.textContent = "R" + Math.round(pan.value * 100);
  }
});

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var number_of_seigyo = 6; //制御する音源の数
var seigyo_elements = new Array(number_of_seigyo); //音源の制御する配列

var arrayBuffer; //インパルス応答のバイナリデータ

async function createReverb() {
  let convolver = audioCtx.createConvolver();
  let response = await fetch("IRData.mp3");
  let arraybuffer = await response.arrayBuffer();
  convolver.buffer = await audioCtx.decodeAudioData(arraybuffer);
  return convolver;
}

var preset = []; //demoのプリセットを格納する配列
preset[0] = [0.1,1];
preset[1] = [0,1]; 
preset[2] = [0.1,1];
preset[3] = [0.1,1];
preset[4] = [0,1];
var preset_name = ["Vocal.mp3","Drums.mp3","Piano.mp3","Guitar.mp3","Bass.mp3"];

for(var i = 0; i < number_of_seigyo; i++) {
  var audioCtx = new AudioContext();
  var gainNode = audioCtx.createGain(); //ボリュームを変えるノードを作成
  var Pannode = audioCtx.createStereoPanner(); //パンのノード

  var analyserNode_before = audioCtx.createAnalyser(); //エフェクターで効果を与える前のアナライザー
  analyserNode_before.fftSize = 2048;

  var effectnode = createReverb();

  var wetgainnode = audioCtx.createGain();
  var drygainnode = audioCtx.createGain();

  var preset_temp = preset[i]; //presetの中の配列を取り出す
  if(preset_temp != undefined){
    wetgainnode.gain.value = preset_temp[0];
    drygainnode.gain.value = preset_temp[1];
  }
  else{
    wetgainnode.gain.value = 0.1;
    drygainnode.gain.value = 0.5;
  }

  var analyserNode_after = audioCtx.createAnalyser(); //エフェクターで効果を与えた後のアナライザー
  analyserNode_after.fftSize = 2048;

  var preset_temp = preset[i]; //presetの中の配列を取り出す
  seigyo_elements[i] = new seigyo(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,wetgainnode,drygainnode,preset_temp,preset_name[i]); //音源の制御のインスタンスを格納
}

var sentaku = 0; //いまどの音源を操作するのかの値
var source = new Array(number_of_seigyo);
var url; //src

var i = 0;
for( let element of document.querySelectorAll('.seigyo') ) { //インスタンスを生成
  seigyo_elements[i].touroku( element,i );
  i++;
}

let effect_set = new effectset(); //エフェクトを操作するインスタンス