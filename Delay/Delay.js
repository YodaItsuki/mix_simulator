class seigyo{ //audiocontextとボリュームのノードとエフェクターのノードのクラス
  constructor(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,feedback){
    this.audioCtx = audioCtx;
    this.gainNode = gainNode;
    this.effectnode = effectnode;
    this.feedback = feedback;
    this.Pannode = Pannode;
    this.analyserNode_before = analyserNode_before;
    this.analyserNode_after = analyserNode_after;
    this.effect_temp = [0.1,0.5]; //パラメーターの値を保存する変数 エフェクトオンオフの時に使う 0ディレイタイム 1減衰値
  }

  touroku(element,sentaku){
    this.audio = element.querySelector('#audio');
    this.filesousin = element.querySelector('#filesousin');
    this.kirikae = element.querySelector('#kirikae');
    this.effect_switch = element.querySelector('#effect_switch');
    this.mute_button = element.querySelector('#mute');
    this.solo_button = element.querySelector('#solo');
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
    this.sentaku = sentaku; //配列内の何番目のインスタンスなのか
    this.sousakinshi = false; //エフェクターが操作禁止かどうかを判定する変数 falseが操作できる trueが操作不可
  }

  sousin(url) { //ファイルを選択したときの動作 audioタグのsrcに入れて各ノードを接続
    for(var i = 0; i < audio.length; i++){ //一旦すべてのトラックの再生を停止して、再生位置を一番最初に戻す
      audio[i].pause();
      audio[i].currentTime = 0; 
    }
    douji.value = "再生";
    this.audio.src = url;
    if(this.source == null){
      this.source = this.audioCtx.createMediaElementSource(this.audio); //ノード作成
    }
    //ノードの接続 入力→ボリューム→パン→エフェクター→出力
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.Pannode);
    this.Pannode.connect(this.audioCtx.destination);
    //ここまでディレイ刺さない音

    this.Pannode.connect(this.feedback);
    this.feedback.connect(this.effectnode);
    this.effectnode.connect(this.audioCtx.destination);
    this.effectnode.connect(this.feedback);
    //ここまでディレイ繰り返し返ってくる音

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

  switch(){ //エフェクトオフ・オンを押したときの動作
    if(this.effect_switch.value == "エフェクトオフ"){ //エフェクトオフ・オンのボタンがエフェクトオフの時
      this.feedback.gain.value = 0;
      if(this.sentaku == sentaku){ //エフェクトを適応する音源を選択して、その選択中の音源のエフェクトをオンオフするときだけ変更する
        effect_set.delay_time.disabled = true; //スライダーを操作不能にする
        effect_set.gensui.disabled = true;
      }
      this.sousakinshi = true; //エフェクターが操作できるかどうかのフラグをtrueにする
      this.effect_switch.value = "エフェクトオン" //ボタンの文字を変える
    }
    else if(this.effect_switch.value == "エフェクトオン"){ //エフェクトオフ・オンのボタンがエフェクトオンの時
      this.feedback.gain.value = this.effect_temp[1];
      if(this.sentaku == sentaku){
        effect_set.delay_time.disabled = false; //スライダーを操作できるようにする
        effect_set.gensui.disabled = false;
      }
      this.sousakinshi = false; //エフェクターが操作できるかどうかのフラグをfalseにする
      this.effect_switch.value = "エフェクトオフ" //ボタンの文字を変える
    }
  }

  kirikaeru() { //切り替えを押したときの動作
    sentaku = this.sentaku; //どれを操作しているかをこのインスタンスの配列の番号にする
    //各エフェクターの値をその音源の値にする
    volume.value = this.volume_temp;
    pan.value = this.Pannode.pan.value;
    effect_set.delay_time.value = this.effect_temp[0];
    effect_set.gensui.value = this.effect_temp[1];
    effect_set.delay_time_view.textContent = this.effect_temp[0];
    effect_set.gensui_view.textContent = this.effect_temp[1];
    if(this.sousakinshi == false){
      effect_set.delay_time.disabled = false; //スライダーを操作できるようにする
      effect_set.gensui.disabled = false;
    }
    else{
      effect_set.delay_time.disabled = true; //スライダーを操作不能にする
      effect_set.gensui.disabled = true;
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
      this.mute_flag = true; //ミュートしてるかどうかのフラグをtrueに変える
    }
    else{
      this.gainNode.gain.value = this.volume_temp; //一時保存していたボリュームの値を戻す
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = false;
      }
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
      this.solo_flag = false; //ソロを判定するフラグをfalseにする
    }
  }
}

class effectset{ //エフェクトを操作するクラス
  constructor(){
    this.delay_time = document.querySelector('#delay_time');
    this.gensui = document.querySelector('#gensui');
    this.delay_time_view = document.querySelector('#delay_time_view'); //スレショルドの値の表示
    this.gensui_view = document.querySelector('#gensui_view'); //スレショルドの値の表示
    this.delay_time.addEventListener( 'input', () => {this.delay_timeset()} ); //スレショルドのスライダーを動かしたときの動作
    this.gensui.addEventListener( 'input', () => {this.gensuiset()} );
    this.sentaku = 0; //エフェクターを適応する音源の選択、デフォルトで一つ目の音源が選択されている
  }

  delay_timeset() {
    seigyo_elements[sentaku].effectnode.delayTime.value = this.delay_time.value; //コンプのスレショルドを書き換える
    this.delay_time_view.textContent = this.delay_time.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[0] = this.delay_time.value; 
    this.delay_time_view.textContent = this.delay_time.value;
  }

  gensuiset(){
    seigyo_elements[sentaku].feedback.gain.value = this.gensui.value; //コンプのスレショルドを書き換える
    this.gensui_view.textContent = this.gensui.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[1] = this.gensui.value;
    this.gensui_view.textContent = this.gensui.value;
  }
}

//ここまでクラス

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var number_of_seigyo = 4; //制御する音源の数
var seigyo_elements = new Array(number_of_seigyo); //音源の制御する配列
for(var i = 0; i < number_of_seigyo; i++) {
  var audioCtx = new AudioContext();
  var gainNode = audioCtx.createGain(); //ボリュームを変えるノードを作成
  var Pannode = audioCtx.createStereoPanner(); //パンのノード

  var analyserNode_before = audioCtx.createAnalyser(); //エフェクターで効果を与える前のアナライザー
  analyserNode_before.fftSize = 2048;

  var analyserNode_after = audioCtx.createAnalyser(); //エフェクターで効果を与えた後のアナライザー
  analyserNode_after.fftSize = 2048;
  var effectnode = audioCtx.createDelay();
  var feedback = audioCtx.createGain();
  effectnode.delayTime.value = 0.1;
  seigyo_elements[i] = new seigyo(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,feedback); //音源の制御のインスタンスを格納
}

var sentaku = 0; //いまどの音源を操作するのかの値
var source = new Array(number_of_seigyo);
var url; //src

var i = 0;
for( let element of document.querySelectorAll('.seigyo') ) { //インスタンスを生成
  seigyo_elements[i].touroku( element,i );
  i++;
}

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
volume.addEventListener('input', function( event ) { //volumeのスライダーを動かしたときの動作
  seigyo_elements[sentaku].gainNode.gain.value = volume.value;
  seigyo_elements[sentaku].volume_temp = volume.value; //ボリュームの値の一時保存 ミュートとソロの時に使う
  console.log(seigyo_elements[sentaku].volume_temp);
});

var pan = document.querySelector('#pan');
pan.addEventListener('input', function( event ) { //panのスライダーを動かしたときの動作
  seigyo_elements[sentaku].Pannode.pan.value = pan.value;
});

let effect_set = new effectset(); //エフェクトを操作するインスタンス

//ここからアナライザーの描画
/*

var analizer_canvas = document.querySelector('#analizer_canvas');
var analizer_canvas_ctx = analizer_canvas.getContext('2d');
window.setInterval(function() { //描画を繰り返す
  var spectrums_before = new Uint8Array(1024);
  seigyo_elements[sentaku].analyserNode_before.getByteFrequencyData(spectrums_before);
  analizer_canvas_ctx.clearRect(0, 0, analizer_canvas.width, analizer_canvas.height);
  analizer_canvas_ctx.beginPath();
  analizer_canvas_ctx.strokeStyle = 'rgb( 0, 0, 0)';
  for (var i = 1, len = 929; i <= len; i++) { //1番目が大体20Hz 929番目が大体20kHz
    if(i < 3){ x = ((analizer_canvas.width / 8) / 2) * (i - 1); } //60Hzまでのx
    else if(i < 5){ x = (analizer_canvas.width / 8) + ((analizer_canvas.width / 8) / 2) * (i - 3); } //100Hzまでのx
    else if(i < 9){ x = (analizer_canvas.width / 8) * 2 + ((analizer_canvas.width / 8) / 4) * (i - 5); } //200Hzまでのx
    else if(i < 23){ x = (analizer_canvas.width / 8) * 3 + ((analizer_canvas.width / 8) / 14) * (i - 9); } //500Hzまでのx
    else if(i < 46){ x = (analizer_canvas.width / 8) * 4 + ((analizer_canvas.width / 8) / 23) * (i - 23); } //1000Hzまでのx
    else if(i < 93){ x = (analizer_canvas.width / 8) * 5 + ((analizer_canvas.width / 8) / 47) * (i - 46); } //2000Hzまでのx
    else if(i < 232){ x = (analizer_canvas.width / 8) * 6 + ((analizer_canvas.width / 8) / 139) * (i - 93); } //5000Hzまでのx
    else if(i < 464){ x = (analizer_canvas.width / 8) * 7 + ((analizer_canvas.width / 8) / 232) * (i - 232); } //10000Hzまでのx
    else if(i <= 929){ x = (analizer_canvas.width / 8) * 8 + ((analizer_canvas.width / 8) / 466) * (i - 464); } //20000Hzまでのx

    var y = (1 - (spectrums_before[i] / 255)) * analizer_canvas.height;

    if (i === 0) {
      analizer_canvas_ctx.moveTo(x, y);
    } else {
        analizer_canvas_ctx.lineTo(x, y);
    }
  }
  analizer_canvas_ctx.stroke();

  var spectrums_after = new Uint8Array(1024);
  seigyo_elements[sentaku].analyserNode_after.getByteFrequencyData(spectrums_after);
  analizer_canvas_ctx.beginPath();
  analizer_canvas_ctx.strokeStyle = 'rgb( 255, 0, 0)';
  for (var i = 1, len = 929; i <= len; i++) {
    if(i < 3){ x = ((analizer_canvas.width / 8) / 2) * (i - 1); } //60Hzまでのx
    else if(i < 5){ x = (analizer_canvas.width / 8) + ((analizer_canvas.width / 8) / 2) * (i - 3); } //100Hzまでのx
    else if(i < 9){ x = (analizer_canvas.width / 8) * 2 + ((analizer_canvas.width / 8) / 4) * (i - 5); } //200Hzまでのx
    else if(i < 23){ x = (analizer_canvas.width / 8) * 3 + ((analizer_canvas.width / 8) / 14) * (i - 9); } //500Hzまでのx
    else if(i < 46){ x = (analizer_canvas.width / 8) * 4 + ((analizer_canvas.width / 8) / 23) * (i - 23); } //1000Hzまでのx
    else if(i < 93){ x = (analizer_canvas.width / 8) * 5 + ((analizer_canvas.width / 8) / 47) * (i - 46); } //2000Hzまでのx
    else if(i < 232){ x = (analizer_canvas.width / 8) * 6 + ((analizer_canvas.width / 8) / 139) * (i - 93); } //5000Hzまでのx
    else if(i < 464){ x = (analizer_canvas.width / 8) * 7 + ((analizer_canvas.width / 8) / 232) * (i - 232); } //10000Hzまでのx
    else if(i <= 929){ x = (analizer_canvas.width / 8) * 8 + ((analizer_canvas.width / 8) / 466) * (i - 464); } //20000Hzまでのx

    var y = (1 - (spectrums_after[i] / 255)) * analizer_canvas.height;

    if (i === 0) {
      analizer_canvas_ctx.moveTo(x, y);
    } else {
      analizer_canvas_ctx.lineTo(x, y);
    }
  }
  analizer_canvas_ctx.stroke();
}, 50);

//ここまでアナライザーの描画
*/