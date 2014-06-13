function dbg(str) {
    //$('body').append(str).append($('<br>'));
}

// Number of OBServationS
var obss=0;

// Onchange handler -- if I contain anything that isn't a valid probability, turn red
function mustBeProbability() {
    var self = $(this);
    var v = self.val();
    if (v != '' && (isNaN(v) || v<0 || v>1)) {
	self.css('background', '#fa0'); 
    } else {
	self.css('background', ''); 
    }
}

// Enable and disable the textboxes for an observation based on which radio button is selected
function changeAble(n,v){
    $('#pb'+n).prop('disabled', v!='known');
    $('#fpr'+n).prop('disabled', v!='fp');
    $('#mean'+n).prop('disabled', v!='norm');
    $('#stdev'+n).prop('disabled', v!='norm');
    $('#nv'+n).prop('disabled', v!='norm');
    $('#n'+n).prop('disabled', v!='binom');
    $('#p'+n).prop('disabled', v!='binom');
    $('#bv'+n).prop('disabled', v!='binom');
}

// We have a new False Positive Rate, recalculate everything downstream
function recalcFpr(n) {
    var pbgna=parseFloat($('#fpr'+n).val());
    var pbga=parseFloat($('#pbga'+n).val());
    var pa=parseFloat($('#pagb'+(n-1)).val());
    var pb = pbga*pa + pbgna*(1-pa);
    $('#pb'+n).val(pb);
    recalcBayes(n);    
}

// We have a new Normal Distribution, recalculate everything downstream
function recalcNorm(n) {
    var mean=parseFloat($('#mean'+n).val());
    var stdev=parseFloat($('#stdev'+n).val());
    var v=parseFloat($('#nv'+n).val());
    if (isNaN(mean) || isNaN(stdev) || isNaN(v)) return;
    var p = jStat.normal.cdf(v, mean, stdev);
    if (p > .5) {
	p = 1-p;
    }
    $('#fpr'+n).val(p);
    recalcFpr(n);
}
    
// We have a new Binomial Distribution, recalculate everything downstream
function recalcBinom(n) {
    var cnt=parseFloat($('#n'+n).val());
    var p=parseFloat($('#p'+n).val());
    var v=parseFloat($('#bv'+n).val());
    if (isNaN(cnt) || isNaN(p) || isNaN(v)) return;
    var e = cnt*p;
    if (v<e) {
	var p2 = jStat.binomial.cdf(v,cnt,p);
    } else if (v>e) {
	var p2 = 1-jStat.binomial.cdf(v-1,cnt,1-p);
    } else {
	var p2 = 1;
    }
    $('#fpr'+n).val(p2);
    recalcFpr(n);
}

// We have new Observation-related information, recalculate everything downstream
function recalcBayes(n) {
    var pa = parseFloat($('#pagb'+(n-1)).val());
    var pbga = parseFloat($('#pbga'+n).val());
    var pb = parseFloat($('#pb'+n).val());
    if (isNaN(pa) || isNaN(pbga) || isNaN(pb)) return;
    var pagb = pa * pbga / pb;
    $('#pagb'+n).val(pagb);
    if (n+1 < obss) {
	recalcbayseAndMaybeFpr(n+1);
    }
}

// We have a new prior, recalculate Overall Likelihood if necessary, and posterior either way
function recalcBayesAndMaybeFpr(n) {
    if ($('#pb'+n).prop('disabled')) {
	recalcFpr(n); // Will call recalcBayes
    } else {
	recalcBayes(n);
    }
}

// The user clicked a "?" button -- show or hilite appropriate help
function showhelp(which) {
    var help = $('#'+which+'help');
    if (help.css('display') == 'none') {
	help.show();
    } else {
	help.css('backgroundColor','#ffa');
	help.animate({'backgroundColor': '#ccf'}, 500);
    }
}

// General purpose "window" closer
function close() {
    $(this).parent().hide();
}

// Add a new observation.  Basically just a big block of HTML.
function moreObss() {
    $(("<div id=obsbox0>" +
       "  <div class=obs>" +
       "    Likelihood of this if the hypothesis in question is true: " +
       "    <input id=pbga0 onchange=recalcBayes(0) class=prob>" +
       "    <a class=help href=# onclick=\"showhelp('cond');\">?</a>" +

       "    <div class=option>" +
       "      <input onchange=\"changeAble(0,'known')\" type=radio name=opts0 id=known0 checked>" +
       "      <label for=known0>Overall likelihood: </label>"+
       "      <input id=pb0 onchange=recalcBayes(0) class=prob>" +
       "      <a class=help href=# onclick=\"showhelp('overall');\">?</a>" +
       "    </div>" +

       "    <div class=option>" +
       "      <input onchange=\"changeAble(0,'fp')\" type=radio name=opts0 id=fp0>" +
       "      <label for=fp0>False positive rate: </label>" +
       "      <input id=fpr0 onchange=recalcFpr(0) class=prob>" +
       "      <a class=help href=# onclick=\"showhelp('fp');\">?</a>" +
       "    </div>" +

       "    <div class=option>" +
       "      <input onchange=\"changeAble(0,'norm')\" type=radio name=opts0 id=norm0>" +
       "      <label for=norm0>Normal distribution with:</label>" +
       "      <a class=help href=# onclick=\"showhelp('norm');\">?</a>" +
       "      <div class=indent>" +
       "        mean=<input id=mean0 onchange=recalcNorm(0)> " +
       "        stdev=<input id=stdev0 onchange=recalcNorm(0)>" +
       "        observation=<input id=nv0 onchange=recalcNorm(0)>" +
       "      </div>" +
       "    </div>" +

       "    <div class=option>" +
       "      <input onchange=\"changeAble(0,'binom')\" type=radio name=opts0 id=binom0>" +
       "      <label for=binom0>Binomial distribution with:</label>" +
       "      <a class=help href=# onclick=\"showhelp('binom');\">?</a>" +
       "      <div class=indent>" +
       "        tries=<input id=n0 onchange=recalcBinom(0)> " +
       "        normal_rate=<input id=p0 onchange=recalcBinom(0) class=prob>" +
       "        successes=<input id=bv0 onchange=recalcBinom(0)>" +
       "      </div>" +
       "    </div>" +

       "  </div>" + // class=obs
       "  <div class=belief>Updated belief: <input id=pagb0 disabled></div>" +
       "</div>").replace(/0/g, obss)
      ).appendTo($('#obs'))
       .find('input.prob').change(mustBeProbability);
    changeAble(obss, 'known');
    obss++;
}
