/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * DOM helpers used by checks (ctx.helpers).
 *
 * Kernel philosophy (A11yCore helpers contract)
 * ---------------------------------------------
 * These helpers exist to keep checks:
 * - **Atomic** (checks decide outcomes; helpers provide facts),
 * - **Deterministic** (no randomness, time, locale, or non-deterministic iteration),
 * - **Serializable** (inlined into generated core.js; no Node-only APIs),
 * - **Standards-aligned** (helpers are mechanism-aware where requirements depend on element/type).
 *
 * Design principles:
 * 1) Helpers return **structured "Info" objects** (facts + mechanism + flags), not verdicts.
 *    - Rules produce outcomes: pass/fail/cantTell/notApplicable.
 * 2) Prefer **mechanism-first** semantics:
 *    - Example: <img> requires an `alt` attribute (even if aria-label exists). Helpers surface that:
 *      `{ present:false, flags:['name-present-but-alt-missing'] }` when `alt` is missing.
 * 3) Keep "kernel" helpers small, stable, and reusable across domains. If/when domain helpers emerge
 *    (tables/media/forms), they should build on these kernel primitives.
 *
 * Kernel helpers included (A → F):
 * A) eligibility: isAccTreeEligible (existing), getEligibilityInfo (new)
 * B) name/description: getAccessibleNameInfo, getAccessibleDescriptionInfo (new)
 * C) text alternatives: getTextAlternativeInfo (new)
 * D) role/focusability: getRoleInfo, getFocusableInfo (new)
 * E) IDREF resolution: resolveIdRefs, getTextFromIdRefs (new)
 * F) selector/snippet: buildSelector/buildSimpleSelector/getOuterHtmlSnippet (existing)
 */

const { createContrastHelpers } = require('./contrast-helpers');
const { createAriaHelpers } = require('./aria-helpers');

function normalizeSelectorList(value) {
  if (!value) return [];
  if (Array.isArray(value))
    return value
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof value === 'string') {
    // allow "#a,#b" or "#a, #b"
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Resolves a raw contextSelector (string | string[] | null) to the
 * normalized selector value (`ctxSelector`) plus the actual root elements to
 * scan (`roots`, deduped, in resolution order), falling back to
 * documentElement/body/html when nothing matches. Extracted out of
 * dom-runner.js's runCore so frame-scan.js can discover which child
 * <iframe>/<frame> elements fall within the same scan scope, without
 * duplicating this resolution logic a second time.
 */
function resolveContextRoots(document, contextSelector) {
  const ctxSelector = Array.isArray(contextSelector)
    ? (() => {
        const list = contextSelector
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean);
        return list.length ? list : null;
      })()
    : typeof contextSelector === 'string' && contextSelector.trim()
      ? contextSelector.trim()
      : null;

  let roots = [];
  {
    const selectorList = Array.isArray(ctxSelector)
      ? ctxSelector
      : ctxSelector
        ? [ctxSelector]
        : [];
    const seen = new Set();
    for (const sel of selectorList) {
      let matches;
      try {
        matches = document.querySelectorAll(sel);
      } catch {
        matches = [];
      }
      for (const el of matches) {
        if (el && !seen.has(el)) {
          seen.add(el);
          roots.push(el);
        }
      }
    }
  }
  if (!roots.length) {
    const fallback = document.documentElement || document.body || document.querySelector('html');
    if (fallback) roots = [fallback];
  }

  return { ctxSelector, roots };
}

function createDomHelpers(opts) {
  // <generated:language-subtags>
  const LANGUAGE_SUBTAGS =
    'aa aaa aab aac aad aae aaf aag aah aai aak aal aam aan aao aap aaq aas aat aau aav aaw aax aaz ab aba abb abc abd abe abf abg abh abi abj abl abm abn abo abp abq abr abs abt abu abv abw abx aby abz aca acb acd ace acf ach aci ack acl acm acn acp acq acr acs act acu acv acw acx acy acz ada adb add ade adf adg adh adi adj adl adn ado adp adq adr ads adt adu adw adx ady adz ae aea aeb aec aed aee aek ael aem aen aeq aer aes aeu aew aey aez af afa afb afd afe afg afh afi afk afn afo afp afs aft afu afz aga agb agc agd age agf agg agh agi agj agk agl agm agn ago agp agq agr ags agt agu agv agw agx agy agz aha ahb ahg ahh ahi ahk ahl ahm ahn aho ahp ahr ahs aht aia aib aic aid aie aif aig aih aii aij aik ail aim ain aio aip aiq air ais ait aiw aix aiy aja ajg aji ajn ajp ajs ajt aju ajw ajz ak akb akc akd ake akf akg akh aki akj akk akl akm ako akp akq akr aks akt aku akv akw akx aky akz ala alc ald ale alf alg alh ali alj alk all alm aln alo alp alq alr als alt alu alv alw alx aly alz am ama amb amc ame amf amg ami amj amk aml amm amn amo amp amq amr ams amt amu amv amw amx amy amz an ana anb anc and ane anf ang anh ani anj ank anl anm ann ano anp anq anr ans ant anu anv anw anx any anz aoa aob aoc aod aoe aof aog aoh aoi aoj aok aol aom aon aor aos aot aou aox aoz apa apb apc apd ape apf apg aph api apj apk apl apm apn apo app apq apr aps apt apu apv apw apx apy apz aqa aqc aqd aqg aqk aql aqm aqn aqp aqr aqt aqz ar arb arc ard are arh ari arj ark arl arn aro arp arq arr ars art aru arv arw arx ary arz as asa asb asc asd ase asf asg ash asi asj ask asl asn aso asp asq asr ass ast asu asv asw asx asy asz ata atb atc atd ate atg ath ati atj atk atl atm atn ato atp atq atr ats att atu atv atw atx aty atz aua aub auc aud aue auf aug auh aui auj auk aul aum aun auo aup auq aur aus aut auu auw aux auy auz av avb avd avi avk avl avm avn avo avs avt avu avv awa awb awc awd awe awg awh awi awk awm awn awo awr aws awt awu awv aww awx awy axb axe axg axk axl axm axx ay aya ayb ayc ayd aye ayg ayh ayi ayk ayl ayn ayo ayp ayq ayr ays ayt ayu ayx ayy ayz az aza azb azc azd azg azj azm azn azo azt azz ba baa bab bac bad bae baf bag bah bai baj bal ban bao bap bar bas bat bau bav baw bax bay baz bba bbb bbc bbd bbe bbf bbg bbh bbi bbj bbk bbl bbm bbn bbo bbp bbq bbr bbs bbt bbu bbv bbw bbx bby bbz bca bcb bcc bcd bce bcf bcg bch bci bcj bck bcl bcm bcn bco bcp bcq bcr bcs bct bcu bcv bcw bcy bcz bda bdb bdc bdd bde bdf bdg bdh bdi bdj bdk bdl bdm bdn bdo bdp bdq bdr bds bdt bdu bdv bdw bdx bdy bdz be bea beb bec bed bee bef beg beh bei bej bek bem beo bep beq ber bes bet beu bev bew bex bey bez bfa bfb bfc bfd bfe bff bfg bfh bfi bfj bfk bfl bfm bfn bfo bfp bfq bfr bfs bft bfu bfw bfx bfy bfz bg bga bgb bgc bgd bge bgf bgg bgi bgj bgk bgl bgm bgn bgo bgp bgq bgr bgs bgt bgu bgv bgw bgx bgy bgz bh bha bhb bhc bhd bhe bhf bhg bhh bhi bhj bhk bhl bhm bhn bho bhp bhq bhr bhs bht bhu bhv bhw bhx bhy bhz bi bia bib bic bid bie bif big bij bik bil bim bin bio bip biq bir bit biu biv biw bix biy biz bja bjb bjc bjd bje bjf bjg bjh bji bjj bjk bjl bjm bjn bjo bjp bjq bjr bjs bjt bju bjv bjw bjx bjy bjz bka bkb bkc bkd bkf bkg bkh bki bkj bkk bkl bkm bkn bko bkp bkq bkr bks bkt bku bkv bkw bkx bky bkz bla blb blc bld ble blf blg blh bli blj blk bll blm bln blo blp blq blr bls blt blv blw blx bly blz bm bma bmb bmc bmd bme bmf bmg bmh bmi bmj bmk bml bmm bmn bmo bmp bmq bmr bms bmt bmu bmv bmw bmx bmy bmz bn bna bnb bnc bnd bne bnf bng bni bnj bnk bnl bnm bnn bno bnp bnq bnr bns bnt bnu bnv bnw bnx bny bnz bo boa bob boe bof bog boh boi boj bok bol bom bon boo bop boq bor bot bou bov bow box boy boz bpa bpb bpc bpd bpe bpg bph bpi bpj bpk bpl bpm bpn bpo bpp bpq bpr bps bpt bpu bpv bpw bpx bpy bpz bqa bqb bqc bqd bqf bqg bqh bqi bqj bqk bql bqm bqn bqo bqp bqq bqr bqs bqt bqu bqv bqw bqx bqy bqz br bra brb brc brd brf brg brh bri brj brk brl brm brn bro brp brq brr brs brt bru brv brw brx bry brz bs bsa bsb bsc bse bsf bsg bsh bsi bsj bsk bsl bsm bsn bso bsp bsq bsr bss bst bsu bsv bsw bsx bsy bta btb btc btd bte btf btg bth bti btj btk btl btm btn bto btp btq btr bts btt btu btv btw btx bty btz bua bub buc bud bue buf bug buh bui buj buk bum bun buo bup buq bus but buu buv buw bux buy buz bva bvb bvc bvd bve bvf bvg bvh bvi bvj bvk bvl bvm bvn bvo bvp bvq bvr bvt bvu bvv bvw bvx bvy bvz bwa bwb bwc bwd bwe bwf bwg bwh bwi bwj bwk bwl bwm bwn bwo bwp bwq bwr bws bwt bwu bww bwx bwy bwz bxa bxb bxc bxd bxe bxf bxg bxh bxi bxj bxk bxl bxm bxn bxo bxp bxq bxr bxs bxu bxv bxw bxx bxz bya byb byc byd bye byf byg byh byi byj byk byl bym byn byo byp byq byr bys byt byv byw byx byy byz bza bzb bzc bzd bze bzf bzg bzh bzi bzj bzk bzl bzm bzn bzo bzp bzq bzr bzs bzt bzu bzv bzw bzx bzy bzz ca caa cab cac cad cae caf cag cah cai caj cak cal cam can cao cap caq car cas cau cav caw cax cay caz cba cbb cbc cbd cbe cbg cbh cbi cbj cbk cbl cbn cbo cbq cbr cbs cbt cbu cbv cbw cby cca ccc ccd cce ccg cch ccj ccl ccm ccn cco ccp ccq ccr ccs cda cdc cdd cde cdf cdg cdh cdi cdj cdm cdn cdo cdr cds cdy cdz ce cea ceb ceg cek cel cen cet cey cfa cfd cfg cfm cga cgc cgg cgk ch chb chc chd chf chg chh chj chk chl chm chn cho chp chq chr cht chw chx chy chz cia cib cic cid cie cih cik cim cin cip cir ciw ciy cja cje cjh cji cjk cjm cjn cjo cjp cjr cjs cjv cjy cka ckb ckh ckl ckm ckn cko ckq ckr cks ckt cku ckv ckx cky ckz cla clc cld cle clh cli clj clk cll clm clo cls clt clu clw cly cma cmc cme cmg cmi cmk cml cmm cmn cmo cmr cms cmt cna cnb cnc cng cnh cni cnk cnl cno cnp cnq cnr cns cnt cnu cnw cnx co coa cob coc cod coe cof cog coh coj cok col com con coo cop coq cot cou cov cow cox coy coz cpa cpb cpc cpe cpf cpg cpi cpn cpo cpp cps cpu cpx cpy cqd cqu cr cra crb crc crd crf crg crh cri crj crk crl crm crn cro crp crq crr crs crt crv crw crx cry crz cs csa csb csc csd cse csf csg csh csi csj csk csl csm csn cso csp csq csr css cst csu csv csw csx csy csz cta ctc ctd cte ctg cth ctl ctm ctn cto ctp cts ctt ctu cty ctz cu cua cub cuc cug cuh cui cuj cuk cul cum cuo cup cuq cur cus cut cuu cuv cuw cux cuy cv cvg cvn cwa cwb cwd cwe cwg cwt cxh cy cya cyb cyo czh czk czn czo czt da daa dac dad dae daf dag dah dai daj dak dal dam dao dap daq dar das dau dav daw dax day daz dba dbb dbd dbe dbf dbg dbi dbj dbl dbm dbn dbo dbp dbq dbr dbt dbu dbv dbw dby dcc dcr dda ddd dde ddg ddi ddj ddn ddo ddr dds ddw de dec ded dee def deg deh dei dek del dem den dep deq der des dev dez dga dgb dgc dgd dge dgg dgh dgi dgk dgl dgn dgo dgr dgs dgt dgu dgw dgx dgz dha dhd dhg dhi dhl dhm dhn dho dhr dhs dhu dhv dhw dhx dia dib dic did dif dig dih dii dij dik dil dim din dio dip diq dir dis dit diu diw dix diy diz dja djb djc djd dje djf dji djj djk djl djm djn djo djr dju djw dka dkg dkk dkl dkr dks dkx dlg dlk dlm dln dma dmb dmc dmd dme dmf dmg dmk dml dmm dmn dmo dmr dms dmu dmv dmw dmx dmy dna dnd dne dng dni dnj dnk dnn dno dnr dnt dnu dnv dnw dny doa dob doc doe dof doh doi dok dol don doo dop doq dor dos dot dov dow dox doy doz dpp dra drb drc drd dre drg drh dri drl drn dro drq drr drs drt dru drw dry dsb dse dsh dsi dsk dsl dsn dso dsq dsz dta dtb dtd dth dti dtk dtm dtn dto dtp dtr dts dtt dtu dty dua dub duc dud due duf dug duh dui duj duk dul dum dun duo dup duq dur dus duu duv duw dux duy duz dv dva dwa dwk dwl dwr dws dwu dww dwy dwz dya dyb dyd dyg dyi dym dyn dyo dyr dyu dyy dz dza dzd dze dzg dzl dzn eaa ebc ebg ebk ebo ebr ebu ecr ecs ecy ee eee efa efe efi ega egl egm ego egx egy ehs ehu eip eit eiv eja eka ekc eke ekg eki ekk ekl ekm eko ekp ekr eky el ele elh eli elk elm elo elp elu elx ema emb eme emg emi emk emm emn emo emp emq ems emu emw emx emy emz en ena enb enc end enf enh enl enm enn eno enq enr enu env enw enx eo eot epi era erg erh eri erk ero err ers ert erw es ese esg esh esi esk esl esm esn eso esq ess esu esx esy et etb etc eth etn eto etr ets ett etu etx etz eu eud euq eve evh evn ewo ext eya eyo eza eze fa faa fab fad faf fag fah fai faj fak fal fam fan fap far fat fau fax fay faz fbl fcs fer ff ffi ffm fgr fi fia fie fif fil fip fir fit fiu fiw fj fkk fkv fla flh fli fll fln flr fly fmp fmu fnb fng fni fo fod foi fom fon for fos fox fpe fqs fr frc frd frk frm fro frp frq frr frs frt fse fsl fss fub fuc fud fue fuf fuh fui fuj fum fun fuq fur fut fuu fuv fuy fvr fwa fwe fy ga gaa gab gac gad gae gaf gag gah gai gaj gak gal gam gan gao gap gaq gar gas gat gau gav gaw gax gay gaz gba gbb gbc gbd gbe gbf gbg gbh gbi gbj gbk gbl gbm gbn gbo gbp gbq gbr gbs gbu gbv gbw gbx gby gbz gcc gcd gce gcf gcl gcn gcr gct gd gda gdb gdc gdd gde gdf gdg gdh gdi gdj gdk gdl gdm gdn gdo gdq gdr gds gdt gdu gdx gea geb gec ged gef geg geh gei gej gek gel gem geq ges gev gew gex gey gez gfk gft gfx gga ggb ggd gge ggg ggk ggl ggn ggo ggr ggt ggu ggw gha ghc ghe ghh ghk ghl ghn gho ghr ghs ght gia gib gic gid gie gig gih gii gil gim gin gio gip giq gir gis git giu giw gix giy giz gji gjk gjm gjn gjr gju gka gkd gke gkn gko gkp gku gl glb glc gld glh gli glj glk gll glo glr glu glw gly gma gmb gmd gme gmg gmh gml gmm gmn gmq gmr gmu gmv gmw gmx gmy gmz gn gna gnb gnc gnd gne gng gnh gni gnj gnk gnl gnm gnn gno gnq gnr gnt gnu gnw gnz goa gob goc god goe gof gog goh goi goj gok gol gom gon goo gop goq gor gos got gou gov gow gox goy goz gpa gpe gpn gqa gqi gqn gqr gqu gra grb grc grd grg grh gri grj grk grm gro grq grr grs grt gru grv grw grx gry grz gse gsg gsl gsm gsn gso gsp gss gsw gta gti gtu gu gua gub guc gud gue guf gug guh gui guk gul gum gun guo gup guq gur gus gut guu guv guw gux guz gv gva gvc gve gvf gvj gvl gvm gvn gvo gvp gvr gvs gvy gwa gwb gwc gwd gwe gwf gwg gwi gwj gwm gwn gwr gwt gwu gww gwx gxx gya gyb gyd gye gyf gyg gyi gyl gym gyn gyo gyr gyy gyz gza gzi gzn ha haa hab hac had hae haf hag hah hai haj hak hal ham han hao hap haq har has hav haw hax hay haz hba hbb hbn hbo hbu hca hch hdn hds hdy he hea hed heg heh hei hem hgm hgw hhi hhr hhy hi hia hib hid hif hig hih hii hij hik hil him hio hir hit hiw hix hji hka hke hkh hkk hkn hks hla hlb hld hle hlt hlu hma hmb hmc hmd hme hmf hmg hmh hmi hmj hmk hml hmm hmn hmp hmq hmr hms hmt hmu hmv hmw hmx hmy hmz hna hnd hne hng hnh hni hnj hnm hnn hno hns hnu ho hoa hob hoc hod hoe hoh hoi hoj hok hol hom hoo hop hor hos hot hov how hoy hoz hpo hps hr hra hrc hre hrk hrm hro hrp hrr hrt hru hrw hrx hrz hsb hsh hsl hsn hss ht hti hto hts htu htx hu hub huc hud hue huf hug huh hui huj huk hul hum huo hup huq hur hus hut huu huv huw hux huy huz hvc hve hvk hvn hvv hwa hwc hwo hy hya hyw hyx hz ia iai ian iap iar iba ibb ibd ibe ibg ibh ibi ibl ibm ibn ibr ibu iby ica ich icl icr id ida idb idc idd ide idi idr ids idt idu ie ifa ifb ife iff ifk ifm ifu ify ig igb ige igg igl igm ign igo igs igw ihb ihi ihp ihw ii iin iir ijc ije ijj ijn ijo ijs ik ike ikh iki ikk ikl iko ikp ikr iks ikt ikv ikw ikx ikz ila ilb ilg ili ilk ill ilm ilo ilp ils ilu ilv ilw ima ime imi iml imn imo imr ims imt imy in inb inc ine ing inh inj inl inm inn ino inp ins int inz io ior iou iow ipi ipo iqu iqw ira ire irh iri irk irn iro irr iru irx iry is isa isc isd ise isg ish isi isk ism isn iso isr ist isu isv it itb itc itd ite iti itk itl itm ito itr its itt itv itw itx ity itz iu ium ivb ivv iw iwk iwm iwo iws ixc ixl iya iyo iyx izh izi izm izr izz ja jaa jab jac jad jae jaf jah jaj jak jal jam jan jao jaq jar jas jat jau jax jay jaz jbe jbi jbj jbk jbm jbn jbo jbr jbt jbu jbw jcs jct jda jdg jdt jeb jee jeg jeh jei jek jel jen jer jet jeu jgb jge jgk jgo jhi jhs ji jia jib jic jid jie jig jih jii jil jim jio jiq jit jiu jiv jiy jje jjr jka jkm jko jkp jkr jks jku jle jls jma jmb jmc jmd jmi jml jmn jmr jms jmw jmx jna jnd jng jni jnj jnl jns job jod jog jor jos jow jpa jpr jpx jqr jra jrb jrr jrt jru jsl jua jub juc jud juh jui juk jul jum jun juo jup jur jus jut juu juw juy jv jvd jvn jw jwi jya jye jyy ka kaa kab kac kad kae kaf kag kah kai kaj kak kam kao kap kaq kar kav kaw kax kay kba kbb kbc kbd kbe kbf kbg kbh kbi kbj kbk kbl kbm kbn kbo kbp kbq kbr kbs kbt kbu kbv kbw kbx kby kbz kca kcb kcc kcd kce kcf kcg kch kci kcj kck kcl kcm kcn kco kcp kcq kcr kcs kct kcu kcv kcw kcx kcy kcz kda kdc kdd kde kdf kdg kdh kdi kdj kdk kdl kdm kdn kdo kdp kdq kdr kdt kdu kdv kdw kdx kdy kdz kea keb kec ked kee kef keg keh kei kej kek kel kem ken keo kep keq ker kes ket keu kev kew kex key kez kfa kfb kfc kfd kfe kff kfg kfh kfi kfj kfk kfl kfm kfn kfo kfp kfq kfr kfs kft kfu kfv kfw kfx kfy kfz kg kga kgb kgc kgd kge kgf kgg kgh kgi kgj kgk kgl kgm kgn kgo kgp kgq kgr kgs kgt kgu kgv kgw kgx kgy kha khb khc khd khe khf khg khh khi khj khk khl khn kho khp khq khr khs kht khu khv khw khx khy khz ki kia kib kic kid kie kif kig kih kii kij kil kim kio kip kiq kis kit kiu kiv kiw kix kiy kiz kj kja kjb kjc kjd kje kjf kjg kjh kji kjj kjk kjl kjm kjn kjo kjp kjq kjr kjs kjt kju kjv kjx kjy kjz kk kka kkb kkc kkd kke kkf kkg kkh kki kkj kkk kkl kkm kkn kko kkp kkq kkr kks kkt kku kkv kkw kkx kky kkz kl kla klb klc kld kle klf klg klh kli klj klk kll klm kln klo klp klq klr kls klt klu klv klw klx kly klz km kma kmb kmc kmd kme kmf kmg kmh kmi kmj kmk kml kmm kmn kmo kmp kmq kmr kms kmt kmu kmv kmw kmx kmy kmz kn kna knb knc knd kne knf kng kni knj knk knl knm knn kno knp knq knr kns knt knu knv knw knx kny knz ko koa koc kod koe kof kog koh koi koj kok kol koo kop koq kos kot kou kov kow kox koy koz kpa kpb kpc kpd kpe kpf kpg kph kpi kpj kpk kpl kpm kpn kpo kpp kpq kpr kps kpt kpu kpv kpw kpx kpy kpz kqa kqb kqc kqd kqe kqf kqg kqh kqi kqj kqk kql kqm kqn kqo kqp kqq kqr kqs kqt kqu kqv kqw kqx kqy kqz kr kra krb krc krd kre krf krh kri krj krk krl krm krn kro krp krr krs krt kru krv krw krx kry krz ks ksa ksb ksc ksd kse ksf ksg ksh ksi ksj ksk ksl ksm ksn kso ksp ksq ksr kss kst ksu ksv ksw ksx ksy ksz kta ktb ktc ktd kte ktf ktg kth kti ktj ktk ktl ktm ktn kto ktp ktq ktr kts ktt ktu ktv ktw ktx kty ktz ku kub kuc kud kue kuf kug kuh kui kuj kuk kul kum kun kuo kup kuq kus kut kuu kuv kuw kux kuy kuz kv kva kvb kvc kvd kve kvf kvg kvh kvi kvj kvk kvl kvm kvn kvo kvp kvq kvr kvs kvt kvu kvv kvw kvx kvy kvz kw kwa kwb kwc kwd kwe kwf kwg kwh kwi kwj kwk kwl kwm kwn kwo kwp kwq kwr kws kwt kwu kwv kww kwx kwy kwz kxa kxb kxc kxd kxe kxf kxh kxi kxj kxk kxl kxm kxn kxo kxp kxq kxr kxs kxt kxu kxv kxw kxx kxy kxz ky kya kyb kyc kyd kye kyf kyg kyh kyi kyj kyk kyl kym kyn kyo kyp kyq kyr kys kyt kyu kyv kyw kyx kyy kyz kza kzb kzc kzd kze kzf kzg kzh kzi kzj kzk kzl kzm kzn kzo kzp kzq kzr kzs kzt kzu kzv kzw kzx kzy kzz la laa lab lac lad lae laf lag lah lai laj lak lal lam lan lap laq lar las lau law lax lay laz lb lba lbb lbc lbe lbf lbg lbi lbj lbk lbl lbm lbn lbo lbq lbr lbs lbt lbu lbv lbw lbx lby lbz lcc lcd lce lcf lch lcl lcm lcp lcq lcs lda ldb ldd ldg ldh ldi ldj ldk ldl ldm ldn ldo ldp ldq lea leb lec led lee lef leg leh lei lej lek lel lem len leo lep leq ler les let leu lev lew lex ley lez lfa lfn lg lga lgb lgg lgh lgi lgk lgl lgm lgn lgo lgq lgr lgs lgt lgu lgz lha lhh lhi lhl lhm lhn lhp lhs lht lhu li lia lib lic lid lie lif lig lih lii lij lik lil lio lip liq lir lis liu liv liw lix liy liz lja lje lji ljl ljp ljw ljx lka lkb lkc lkd lke lkh lki lkj lkl lkm lkn lko lkr lks lkt lku lky lla llb llc lld lle llf llg llh lli llj llk lll llm lln llo llp llq lls llu llx lma lmb lmc lmd lme lmf lmg lmh lmi lmj lmk lml lmm lmn lmo lmp lmq lmr lmu lmv lmw lmx lmy lmz ln lna lnb lnd lng lnh lni lnj lnl lnm lnn lno lns lnu lnw lnz lo loa lob loc loe lof log loh loi loj lok lol lom lon loo lop loq lor los lot lou lov low lox loy loz lpa lpe lpn lpo lpx lqr lra lrc lre lrg lri lrk lrl lrm lrn lro lrr lrt lrv lrz lsa lsb lsc lsd lse lsg lsh lsi lsl lsm lsn lso lsp lsr lss lst lsv lsw lsy lt ltc ltg lth lti ltn lto lts ltu lu lua luc lud lue luf luh lui luj luk lul lum lun luo lup luq lur lus lut luu luv luw luy luz lv lva lvi lvk lvl lvs lvu lwa lwe lwg lwh lwl lwm lwo lws lwt lwu lww lxm lya lyg lyn lzh lzl lzn lzz maa mab mad mae maf mag mai maj mak mam man map maq mas mat mau mav maw max maz mba mbb mbc mbd mbe mbf mbh mbi mbj mbk mbl mbm mbn mbo mbp mbq mbr mbs mbt mbu mbv mbw mbx mby mbz mca mcb mcc mcd mce mcf mcg mch mci mcj mck mcl mcm mcn mco mcp mcq mcr mcs mct mcu mcv mcw mcx mcy mcz mda mdb mdc mdd mde mdf mdg mdh mdi mdj mdk mdl mdm mdn mdp mdq mdr mds mdt mdu mdv mdw mdx mdy mdz mea meb mec med mee mef meg meh mei mej mek mel mem men meo mep meq mer mes met meu mev mew mey mez mfa mfb mfc mfd mfe mff mfg mfh mfi mfj mfk mfl mfm mfn mfo mfp mfq mfr mfs mft mfu mfv mfw mfx mfy mfz mg mga mgb mgc mgd mge mgf mgg mgh mgi mgj mgk mgl mgm mgn mgo mgp mgq mgr mgs mgt mgu mgv mgw mgx mgy mgz mh mha mhb mhc mhd mhe mhf mhg mhh mhi mhj mhk mhl mhm mhn mho mhp mhq mhr mhs mht mhu mhw mhx mhy mhz mi mia mib mic mid mie mif mig mih mii mij mik mil mim min mio mip miq mir mis mit miu miw mix miy miz mja mjb mjc mjd mje mjg mjh mji mjj mjk mjl mjm mjn mjo mjp mjq mjr mjs mjt mju mjv mjw mjx mjy mjz mk mka mkb mkc mke mkf mkg mkh mki mkj mkk mkl mkm mkn mko mkp mkq mkr mks mkt mku mkv mkw mkx mky mkz ml mla mlb mlc mld mle mlf mlh mli mlj mlk mll mlm mln mlo mlp mlq mlr mls mlu mlv mlw mlx mlz mma mmb mmc mmd mme mmf mmg mmh mmi mmj mmk mml mmm mmn mmo mmp mmq mmr mmt mmu mmv mmw mmx mmy mmz mn mna mnb mnc mnd mne mnf mng mnh mni mnj mnk mnl mnm mnn mno mnp mnq mnr mns mnt mnu mnv mnw mnx mny mnz mo moa moc mod moe mof mog moh moi moj mok mom moo mop moq mor mos mot mou mov mow mox moy moz mpa mpb mpc mpd mpe mpg mph mpi mpj mpk mpl mpm mpn mpo mpp mpq mpr mps mpt mpu mpv mpw mpx mpy mpz mqa mqb mqc mqe mqf mqg mqh mqi mqj mqk mql mqm mqn mqo mqp mqq mqr mqs mqt mqu mqv mqw mqx mqy mqz mr mra mrb mrc mrd mre mrf mrg mrh mrj mrk mrl mrm mrn mro mrp mrq mrr mrs mrt mru mrv mrw mrx mry mrz ms msb msc msd mse msf msg msh msi msj msk msl msm msn mso msp msq msr mss mst msu msv msw msx msy msz mt mta mtb mtc mtd mte mtf mtg mth mti mtj mtk mtl mtm mtn mto mtp mtq mtr mts mtt mtu mtv mtw mtx mty mua mub muc mud mue mug muh mui muj muk mul mum mun muo mup muq mur mus mut muu muv mux muy muz mva mvb mvd mve mvf mvg mvh mvi mvk mvl mvm mvn mvo mvp mvq mvr mvs mvt mvu mvv mvw mvx mvy mvz mwa mwb mwc mwd mwe mwf mwg mwh mwi mwj mwk mwl mwm mwn mwo mwp mwq mwr mws mwt mwu mwv mww mwx mwy mwz mxa mxb mxc mxd mxe mxf mxg mxh mxi mxj mxk mxl mxm mxn mxo mxp mxq mxr mxs mxt mxu mxv mxw mxx mxy mxz my myb myc myd mye myf myg myh myi myj myk myl mym myn myo myp myq myr mys myt myu myv myw myx myy myz mza mzb mzc mzd mze mzg mzh mzi mzj mzk mzl mzm mzn mzo mzp mzq mzr mzs mzt mzu mzv mzw mzx mzy mzz na naa nab nac nad nae naf nag nah nai naj nak nal nam nan nao nap naq nar nas nat naw nax nay naz nb nba nbb nbc nbd nbe nbf nbg nbh nbi nbj nbk nbm nbn nbo nbp nbq nbr nbs nbt nbu nbv nbw nbx nby nca ncb ncc ncd nce ncf ncg nch nci ncj nck ncl ncm ncn nco ncp ncq ncr ncs nct ncu ncx ncz nd nda ndb ndc ndd ndf ndg ndh ndi ndj ndk ndl ndm ndn ndp ndq ndr nds ndt ndu ndv ndw ndx ndy ndz ne nea neb nec ned nee nef neg neh nei nej nek nem nen neo neq ner nes net neu nev new nex ney nez nfa nfd nfl nfr nfu ng nga ngb ngc ngd nge ngf ngg ngh ngi ngj ngk ngl ngm ngn ngo ngp ngq ngr ngs ngt ngu ngv ngw ngx ngy ngz nha nhb nhc nhd nhe nhf nhg nhh nhi nhk nhm nhn nho nhp nhq nhr nht nhu nhv nhw nhx nhy nhz nia nib nic nid nie nif nig nih nii nij nik nil nim nin nio niq nir nis nit niu niv niw nix niy niz nja njb njd njh nji njj njl njm njn njo njr njs njt nju njx njy njz nka nkb nkc nkd nke nkf nkg nkh nki nkj nkk nkm nkn nko nkp nkq nkr nks nkt nku nkv nkw nkx nkz nl nla nlc nle nlg nli nlj nlk nll nlm nln nlo nlq nlr nlu nlv nlw nlx nly nlz nma nmb nmc nmd nme nmf nmg nmh nmi nmj nmk nml nmm nmn nmo nmp nmq nmr nms nmt nmu nmv nmw nmx nmy nmz nn nna nnb nnc nnd nne nnf nng nnh nni nnj nnk nnl nnm nnn nnp nnq nnr nns nnt nnu nnv nnw nnx nny nnz no noa noc nod noe nof nog noh noi noj nok nol nom non noo nop noq nos not nou nov now noy noz npa npb npg nph npi npl npn npo nps npu npx npy nqg nqk nql nqm nqn nqo nqq nqt nqy nr nra nrb nrc nre nrf nrg nri nrk nrl nrm nrn nrp nrr nrt nru nrx nrz nsa nsb nsc nsd nse nsf nsg nsh nsi nsk nsl nsm nsn nso nsp nsq nsr nss nst nsu nsv nsw nsx nsy nsz ntd nte ntg nti ntj ntk ntm nto ntp ntr nts ntu ntw ntx nty ntz nua nub nuc nud nue nuf nug nuh nui nuj nuk nul num nun nuo nup nuq nur nus nut nuu nuv nuw nux nuy nuz nv nvh nvm nvo nwa nwb nwc nwe nwg nwi nwm nwo nwr nww nwx nwy nxa nxd nxe nxg nxi nxk nxl nxm nxn nxo nxq nxr nxu nxx ny nyb nyc nyd nye nyf nyg nyh nyi nyj nyk nyl nym nyn nyo nyp nyq nyr nys nyt nyu nyv nyw nyx nyy nza nzb nzd nzi nzk nzm nzr nzs nzu nzy nzz oaa oac oak oar oav obi obk obl obm obo obr obt obu oc oca och ocm oco ocu oda odk odt odu ofo ofs ofu ogb ogc oge ogg ogo ogu oht ohu oia oie oin oj ojb ojc ojg ojp ojs ojv ojw oka okb okc okd oke okg okh oki okj okk okl okm okn oko okr oks oku okv okx okz ola old ole olk olm olo olr olt olu om oma omb omc ome omg omi omk oml omn omo omp omq omr omt omu omv omw omx omy ona onb one ong oni onj onk onn ono onp onr ons ont onu onw onx ood oog oon oor oos opa opk opm opo opt opy or ora orc ore org orh orn oro orr ors ort oru orv orw orx ory orz os osa osc osi osn oso osp ost osu osx ota otb otd ote oti otk otl otm otn oto otq otr ots ott otu otw otx oty otz oua oub oue oui oum oun ovd owi owl oyb oyd oym oyy ozm pa paa pab pac pad pae paf pag pah pai pak pal pam pao pap paq par pas pat pau pav paw pax pay paz pbb pbc pbe pbf pbg pbh pbi pbl pbm pbn pbo pbp pbr pbs pbt pbu pbv pby pbz pca pcb pcc pcd pce pcf pcg pch pci pcj pck pcl pcm pcn pcp pcr pcw pda pdc pdi pdn pdo pdt pdu pea peb ped pee pef peg peh pei pej pek pel pem peo pep peq pes pev pex pey pez pfa pfe pfl pga pgd pgg pgi pgk pgl pgn pgs pgu pgy pgz pha phd phg phh phi phj phk phl phm phn pho phq phr pht phu phv phw pi pia pib pic pid pie pif pig pih pii pij pil pim pin pio pip pir pis pit piu piv piw pix piy piz pjt pka pkb pkc pkg pkh pkn pko pkp pkr pks pkt pku pl pla plb plc pld ple plf plg plh plj plk pll pln plo plp plq plr pls plt plu plv plw ply plz pma pmb pmc pmd pme pmf pmh pmi pmj pmk pml pmm pmn pmo pmq pmr pms pmt pmu pmw pmx pmy pmz pna pnb pnc pnd pne png pnh pni pnj pnk pnl pnm pnn pno pnp pnq pnr pns pnt pnu pnv pnw pnx pny pnz poc pod poe pof pog poh poi pok pom pon poo pop poq pos pot pov pow pox poy poz ppa ppe ppi ppk ppl ppm ppn ppo ppp ppq ppr pps ppt ppu pqa pqe pqm pqw pra prb prc prd pre prf prg prh pri prk prl prm prn pro prp prq prr prs prt pru prw prx pry prz ps psa psc psd pse psg psh psi psl psm psn pso psp psq psr pss pst psu psw psy pt pta pth pti ptn pto ptp ptq ptr ptt ptu ptv ptw pty pua pub puc pud pue puf pug pui puj puk pum puo pup puq pur put puu puw pux puy puz pwa pwb pwg pwi pwm pwn pwo pwr pww pxm pye pym pyn pys pyu pyx pyy pze pzh pzn qaa..qtz qu qua qub quc qud quf qug quh qui quk qul qum qun qup quq qur qus quv quw qux quy quz qva qvc qve qvh qvi qvj qvl qvm qvn qvo qvp qvs qvw qvy qvz qwa qwc qwe qwh qwm qws qwt qxa qxc qxh qxl qxn qxo qxp qxq qxr qxs qxt qxu qxw qya qyp raa rab rac rad raf rag rah rai raj rak ral ram ran rao rap raq rar ras rat rau rav raw rax ray raz rbb rbk rbl rbp rcf rdb rea reb ree reg rei rej rel rem ren rer res ret rey rga rge rgk rgn rgr rgs rgu rhg rhp ria rib rie rif ril rim rin rir rit riu rjg rji rjs rka rkb rkh rki rkm rkt rkw rm rma rmb rmc rmd rme rmf rmg rmh rmi rmk rml rmm rmn rmo rmp rmq rmr rms rmt rmu rmv rmw rmx rmy rmz rn rna rnb rnd rng rnl rnn rnp rnr rnw ro roa rob roc rod roe rof rog rol rom roo rop ror rou row rpn rpt rri rrm rro rrt rsb rsi rsk rsl rsm rsn rsw rtc rth rtm rts rtw ru rub ruc rue ruf rug ruh rui ruk ruo rup ruq rut ruu ruy ruz rw rwa rwk rwl rwm rwo rwr rxd rxw ryn rys ryu rzh sa saa sab sac sad sae saf sah sai saj sak sal sam sao sap saq sar sas sat sau sav saw sax say saz sba sbb sbc sbd sbe sbf sbg sbh sbi sbj sbk sbl sbm sbn sbo sbp sbq sbr sbs sbt sbu sbv sbw sbx sby sbz sc sca scb sce scf scg sch sci sck scl scn sco scp scq scs sct scu scv scw scx sd sda sdb sdc sde sdf sdg sdh sdj sdk sdl sdm sdn sdo sdp sdq sdr sds sdt sdu sdv sdx sdz se sea seb sec sed see sef seg seh sei sej sek sel sem sen seo sep seq ser ses set seu sev sew sey sez sfb sfe sfm sfs sfw sg sga sgb sgc sgd sge sgg sgh sgi sgj sgk sgl sgm sgn sgo sgp sgr sgs sgt sgu sgw sgx sgy sgz sh sha shb shc shd she shg shh shi shj shk shl shm shn sho shp shq shr shs sht shu shv shw shx shy shz si sia sib sid sie sif sig sih sii sij sik sil sim sio sip siq sir sis sit siu siv siw six siy siz sja sjb sjc sjd sje sjg sjk sjl sjm sjn sjo sjp sjr sjs sjt sju sjw sk ska skb skc skd ske skf skg skh ski skj skk skm skn sko skp skq skr sks skt sku skv skw skx sky skz sl sla slc sld sle slf slg slh sli slj sll slm sln slp slq slr sls slt slu slw slx sly slz sm sma smb smc smd smf smg smh smi smj smk sml smm smn smp smq smr sms smt smu smv smw smx smy smz sn snb snc sne snf sng snh sni snj snk snl snm snn sno snp snq snr sns snu snv snw snx sny snz so soa sob soc sod soe sog soh soi soj sok sol son soo sop soq sor sos sou sov sow sox soy soz spb spc spd spe spg spi spk spl spm spn spo spp spq spr sps spt spu spv spx spy sq sqa sqh sqj sqk sqm sqn sqo sqq sqr sqs sqt squ sqx sr sra srb src sre srf srg srh sri srk srl srm srn sro srq srr srs srt sru srv srw srx sry srz ss ssa ssb ssc ssd sse ssf ssg ssh ssi ssj ssk ssl ssm ssn sso ssp ssq ssr sss sst ssu ssv ssx ssy ssz st sta stb std ste stf stg sth sti stj stk stl stm stn sto stp stq str sts stt stu stv stw sty su sua sub suc sue sug sui suj suk sul sum suo suq sur sus sut suv suw sux suy suz sv sva svb svc sve svk svm svr svs svx sw swb swc swf swg swh swi swj swk swl swm swn swo swp swq swr sws swt swu swv sww swx swy sxb sxc sxe sxg sxk sxl sxm sxn sxo sxr sxs sxu sxw sya syb syc syd syi syk syl sym syn syo syr sys syw syx syy sza szb szc szd sze szg szl szn szp szs szv szw szy ta taa tab tac tad tae taf tag tai taj tak tal tan tao tap taq tar tas tau tav taw tax tay taz tba tbb tbc tbd tbe tbf tbg tbh tbi tbj tbk tbl tbm tbn tbo tbp tbq tbr tbs tbt tbu tbv tbw tbx tby tbz tca tcb tcc tcd tce tcf tcg tch tci tck tcl tcm tcn tco tcp tcq tcs tct tcu tcw tcx tcy tcz tda tdb tdc tdd tde tdf tdg tdh tdi tdj tdk tdl tdm tdn tdo tdq tdr tds tdt tdu tdv tdx tdy te tea teb tec ted tee tef teg teh tei tek tem ten teo tep teq ter tes tet teu tev tew tex tey tez tfi tfn tfo tfr tft tg tga tgb tgc tgd tge tgf tgg tgh tgi tgj tgn tgo tgp tgq tgr tgs tgt tgu tgv tgw tgx tgy tgz th thc thd the thf thh thi thk thl thm thn thp thq thr ths tht thu thv thw thx thy thz ti tia tic tid tie tif tig tih tii tij tik til tim tin tio tip tiq tis tit tiu tiv tiw tix tiy tiz tja tjg tji tjj tjl tjm tjn tjo tjp tjs tju tjw tk tka tkb tkd tke tkf tkg tkk tkl tkm tkn tkp tkq tkr tks tkt tku tkv tkw tkx tkz tl tla tlb tlc tld tlf tlg tlh tli tlj tlk tll tlm tln tlo tlp tlq tlr tls tlt tlu tlv tlw tlx tly tma tmb tmc tmd tme tmf tmg tmh tmi tmj tmk tml tmm tmn tmo tmp tmq tmr tms tmt tmu tmv tmw tmy tmz tn tna tnb tnc tnd tne tnf tng tnh tni tnk tnl tnm tnn tno tnp tnq tnr tns tnt tnu tnv tnw tnx tny tnz to tob toc tod toe tof tog toh toi toj tok tol tom too top toq tor tos tou tov tow tox toy toz tpa tpc tpe tpf tpg tpi tpj tpk tpl tpm tpn tpo tpp tpq tpr tpt tpu tpv tpw tpx tpy tpz tqb tql tqm tqn tqo tqp tqq tqr tqt tqu tqw tr tra trb trc trd tre trf trg trh tri trj trk trl trm trn tro trp trq trr trs trt tru trv trw trx try trz ts tsa tsb tsc tsd tse tsf tsg tsh tsi tsj tsk tsl tsm tsp tsq tsr tss tst tsu tsv tsw tsx tsy tsz tt tta ttb ttc ttd tte ttf ttg tth tti ttj ttk ttl ttm ttn tto ttp ttq ttr tts ttt ttu ttv ttw tty ttz tua tub tuc tud tue tuf tug tuh tui tuj tul tum tun tuo tup tuq tus tut tuu tuv tuw tux tuy tuz tva tvd tve tvi tvk tvl tvm tvn tvo tvs tvt tvu tvw tvx tvy tw twa twb twc twd twe twf twg twh twl twm twn two twp twq twr twt twu tww twx twy txa txb txc txe txg txh txi txj txm txn txo txq txr txs txt txu txx txy ty tya tye tyh tyi tyj tyl tyn typ tyr tys tyt tyu tyv tyx tyy tyz tza tzh tzj tzl tzm tzn tzo tzx uam uan uar uba ubi ubl ubr ubu uby uda ude udg udi udj udl udm udu ues ufi ug uga ugb uge ugh ugn ugo ugy uha uhn uis uiv uji uk uka ukg ukh uki ukk ukl ukp ukq uks uku ukv ukw uky ula ulb ulc ule ulf uli ulk ull ulm uln ulu ulw uly uma umb umc umd umg umi umm umn umo ump umr ums umu una und une ung uni unk unm unn unp unr unu unx unz uok uon upi upv ur ura urb urc ure urf urg urh uri urj urk url urm urn uro urp urr urt uru urv urw urx ury urz usa ush usi usk usp uss usu uta ute uth utp utr utu uum uun uur uuu uve uvh uvl uwa uya uz uzn uzs vaa vae vaf vag vah vai vaj val vam van vao vap var vas vau vav vay vbb vbk ve vec ved vel vem veo vep ver vgr vgt vi vic vid vif vig vil vin vis vit viv vjk vka vki vkj vkk vkl vkm vkn vko vkp vkt vku vkz vlp vls vma vmb vmc vmd vme vmf vmg vmh vmi vmj vmk vml vmm vmp vmq vmr vms vmu vmv vmw vmx vmy vmz vnk vnm vnp vo vor vot vra vro vrs vrt vsi vsl vsn vsv vto vum vun vut vwa wa waa wab wac wad wae waf wag wah wai waj wak wal wam wan wao wap waq war was wat wau wav waw wax way waz wba wbb wbe wbf wbh wbi wbj wbk wbl wbm wbp wbq wbr wbs wbt wbv wbw wca wci wdd wdg wdj wdk wdt wdu wdy wea wec wed weg weh wei wem wen weo wep wer wes wet weu wew wfg wga wgb wgg wgi wgo wgu wgw wgy wha whg whk whu wib wic wie wif wig wih wii wij wik wil wim win wir wit wiu wiv wiw wiy wja wji wka wkb wkd wkl wkr wku wkw wky wla wlc wle wlg wlh wli wlk wll wlm wlo wlr wls wlu wlv wlw wlx wly wma wmb wmc wmd wme wmg wmh wmi wmm wmn wmo wms wmt wmw wmx wnb wnc wnd wne wng wni wnk wnm wnn wno wnp wnu wnw wny wo woa wob woc wod woe wof wog woi wok wom won woo wor wos wow woy wpc wra wrb wrd wrg wrh wri wrk wrl wrm wrn wro wrp wrr wrs wru wrv wrw wrx wry wrz wsa wsg wsi wsk wsr wss wsu wsv wtb wtf wth wti wtk wtm wtw wua wub wud wuh wul wum wun wur wut wuu wuv wux wuy wwa wwb wwo wwr www wxa wxw wya wyb wyi wym wyn wyr wyy xaa xab xac xad xae xag xai xaj xak xal xam xan xao xap xaq xar xas xat xau xav xaw xay xba xbb xbc xbd xbe xbg xbi xbj xbm xbn xbo xbp xbr xbw xbx xby xcb xcc xce xcg xch xcl xcm xcn xco xcr xct xcu xcv xcw xcy xda xdc xdk xdm xdo xdq xdy xeb xed xeg xel xem xep xer xes xet xeu xfa xga xgb xgd xgf xgg xgi xgl xgm xgn xgr xgu xgw xh xha xhc xhd xhe xhm xhr xht xhu xhv xia xib xii xil xin xip xir xis xiv xiy xjb xjt xka xkb xkc xkd xke xkf xkg xkh xki xkj xkk xkl xkn xko xkp xkq xkr xks xkt xku xkv xkw xkx xky xkz xla xlb xlc xld xle xlg xli xln xlo xlp xls xlu xly xma xmb xmc xmd xme xmf xmg xmh xmj xmk xml xmm xmn xmo xmp xmq xmr xms xmt xmu xmv xmw xmx xmy xmz xna xnb xnd xng xnh xni xnj xnk xnm xnn xno xnq xnr xns xnt xnu xny xnz xoc xod xog xoi xok xom xon xoo xop xor xow xpa xpb xpc xpd xpe xpf xpg xph xpi xpj xpk xpl xpm xpn xpo xpp xpq xpr xps xpt xpu xpv xpw xpx xpy xpz xqa xqt xra xrb xrd xre xrg xri xrm xrn xrq xrr xrt xru xrw xsa xsb xsc xsd xse xsh xsi xsj xsl xsm xsn xso xsp xsq xsr xss xsu xsv xsy xta xtb xtc xtd xte xtg xth xti xtj xtl xtm xtn xto xtp xtq xtr xts xtt xtu xtv xtw xty xtz xua xub xud xug xuj xul xum xun xuo xup xur xut xuu xve xvi xvn xvo xvs xwa xwc xwd xwe xwg xwj xwk xwl xwo xwr xwt xww xxb xxk xxm xxr xxt xya xyb xyj xyk xyl xyt xyy xzh xzm xzp yaa yab yac yad yae yaf yag yah yai yaj yak yal yam yan yao yap yaq yar yas yat yau yav yaw yax yay yaz yba ybb ybd ybe ybh ybi ybj ybk ybl ybm ybn ybo ybx yby ych ycl ycn ycp ycr yda ydd yde ydg ydk yds yea yec yee yei yej yel yen yer yes yet yeu yev yey yga ygi ygl ygm ygp ygr ygs ygu ygw yha yhd yhl yhs yi yia yif yig yih yii yij yik yil yim yin yip yiq yir yis yit yiu yiv yix yiy yiz yka ykg ykh yki ykk ykl ykm ykn yko ykr ykt yku yky yla ylb yle ylg yli yll ylm yln ylo ylr ylu yly yma ymb ymc ymd yme ymg ymh ymi ymk yml ymm ymn ymo ymp ymq ymr yms ymt ymx ymz yna ynb ynd yne yng ynh ynk ynl ynn yno ynq yns ynu yo yob yog yoi yok yol yom yon yos yot yox yoy ypa ypb ypg yph ypk ypm ypn ypo ypp ypz yra yrb yre yri yrk yrl yrm yrn yro yrs yrw yry ysc ysd ysg ysl ysm ysn yso ysp ysr yss ysy yta ytl ytp ytw yty yua yub yuc yud yue yuf yug yui yuj yuk yul yum yun yup yuq yur yut yuu yuw yux yuy yuz yva yvt ywa ywg ywl ywn ywq ywr ywt ywu yww yxa yxg yxl yxm yxu yxy yyr yyu yyz yzg yzk za zaa zab zac zad zae zaf zag zah zai zaj zak zal zam zao zap zaq zar zas zat zau zav zaw zax zay zaz zba zbc zbe zbl zbt zbu zbw zca zcd zch zdj zea zeg zeh zem zen zga zgb zgh zgm zgn zgr zh zhb zhd zhi zhn zhw zhx zia zib zik zil zim zin zir ziw ziz zka zkb zkd zkg zkh zkk zkn zko zkp zkr zkt zku zkv zkz zla zle zlj zlm zln zlq zls zlu zlw zma zmb zmc zmd zme zmf zmg zmh zmi zmj zmk zml zmm zmn zmo zmp zmq zmr zms zmt zmu zmv zmw zmx zmy zmz zna znd zne zng znk zns zoc zoh zom zoo zoq zor zos zpa zpb zpc zpd zpe zpf zpg zph zpi zpj zpk zpl zpm zpn zpo zpp zpq zpr zps zpt zpu zpv zpw zpx zpy zpz zqe zra zrg zrn zro zrp zrs zsa zsk zsl zsm zsr zsu zte ztg ztl ztm ztn ztp ztq zts ztt ztu ztx zty zu zua zuh zum zun zuy zwa zxx zyb zyg zyj zyn zyp zza zzj';
  // </generated:language-subtags>

  // BCP 47 well-formedness plus a registry check on the primary subtag. Shape
  // alone accepts "eng" and "em-US", which look like language tags but are not
  // registered: the IANA registry lists a three-letter subtag only when no
  // two-letter one exists, so "en" is registered and "eng" is not.
  let __languageSubtagSet = null;
  function isRegisteredLanguageSubtag(subtag) {
    if (!__languageSubtagSet) __languageSubtagSet = new Set(LANGUAGE_SUBTAGS.split(' '));
    return __languageSubtagSet.has(String(subtag || '').toLowerCase());
  }

  function isValidLanguageTag(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return false;
    if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(raw)) return false;
    return isRegisteredLanguageSubtag(raw.split('-')[0]);
  }

  const document = opts && opts.document ? opts.document : null;
  const window = opts && opts.window ? opts.window : null;
  // Some engine paths may not pass opts.window; recover it from document when possible.
  const realmWindow = window || (document && document.defaultView) || null;
  // opts.root accepts either a single element (back-compat -- every
  // existing call site, including every test, passes one) or an array of
  // elements (multi-region contextSelector support, dom-runner.js). Every
  // internal consumer below works off `roots` (always an array, possibly
  // empty) rather than assuming a single element.
  const roots = (() => {
    const r = opts && opts.root;
    if (Array.isArray(r)) return r.filter((x) => x && typeof x === 'object');
    if (r && typeof r === 'object') return [r];
    return [];
  })();
  // Default on: opt OUT with `includeShadowDom: false`, not opt in.
  const includeShadowDom = !(opts && opts.includeShadowDom === false);
  // Default off: by default, helper queries skip structurally/CSS-hidden
  // subtrees (display:none, [hidden], closed <details>, etc.). Callers can
  // opt out with includeHiddenElements:true.
  const includeHiddenElements = !!(opts && opts.includeHiddenElements === true);
  const excludeSelectors = Array.isArray(opts && opts.excludeSelectors)
    ? opts.excludeSelectors
    : [];
  // Default off: explicit opt-in for "this scan target was never meant to
  // represent a real page" (e.g. a raw component fragment parsed on its
  // own), regardless of whether document.documentElement happens to be in
  // scope. See isWholeDocumentScope() below.
  const fragment = !!(opts && opts.fragment === true);

  // Rule-scoped excludes (engineOptions.rules[ruleId].excludeSelectors), set
  // by dom-runner.js immediately before invoking each rule's applicability/
  // run function via __setActiveRuleExcludeSelectors(). Safe as mutable
  // closure state because rule execution is synchronous and single-rule-
  // at-a-time: exactly one rule's excludes are ever "active" at once.
  var __activeRuleExcludeSelectors = [];

  function __getEffectiveExcludeSelectors() {
    return __activeRuleExcludeSelectors.length
      ? excludeSelectors.concat(__activeRuleExcludeSelectors)
      : excludeSelectors;
  }

  function __setActiveRuleExcludeSelectors(list) {
    __activeRuleExcludeSelectors = normalizeSelectorList(list);
  }

  // Selector-related caches (selector uniqueness index, per-element built
  // selector strings) depend on includeShadowDom/the effective exclude
  // list, since those change which elements are considered when checking
  // uniqueness. The underlying storage is shared across createDomHelpers()
  // calls on the same window/document (see __domSharedCache below), so a
  // run -- or a rule with its own rule-scoped excludes -- must not
  // read/write another run/rule's cached selectors. This key partitions
  // those caches per effective option set; recomputed per call (not a
  // constant) since the effective list changes as the active rule changes.
  function __getSelectorOptsKey() {
    return (
      (includeShadowDom ? 'sd1' : 'sd0') +
      '|' +
      __getEffectiveExcludeSelectors().slice().sort().join(',')
    );
  }

  // -------------------------------------------------------------------------
  // Per-run shared caches (DOM helpers)
  // Stored on the realm window when possible so multiple helper instances
  // within the same run share caches deterministically.
  // -------------------------------------------------------------------------
  var __domSharedCache = {};
  var __selectorCache = null;
  var __outerHtmlCache = null;
  var __idLookupDocCache = null; // Map<string, Element|null>
  var __idLookupRootCache = null; // Map<string, Element|null>
  var __idRefCacheByRoot = null; // WeakMap<object, Map<string, {refs, missing, flags, partsLen}>>
  var __idRefReverseIndexByScope = null; // WeakMap<object, Map<string, Set<Element>>>
  var __uniqIndexByScope = null; // WeakMap<object, object> (selector uniqueness index per scope)
  var __shadowRootsByRoot = null; // WeakMap<object, Array<object>> (cached open shadow roots per root)

  // Shared recursion-depth guard across the mutually-recursive naming
  // functions (computeIdRefTargetTextAlternative <-> getContentNameInfo <->
  // getAccessibleNameInfo, via aria-labelledby targets that themselves
  // contain elements with their own aria-labelledby). Each per-call
  // `visited` Set only guards against cycles *within* a single top-level
  // getTextFromIdRefs() invocation; a cross-function hop (e.g. resolving a
  // labelledby target's content, which contains a descendant with its own
  // aria-labelledby) starts a *fresh* visited Set and would defeat that
  // guard on a genuine circular reference. This counter bounds the total
  // combined call depth regardless of which function is on the stack.
  var __nameComputationDepth = 0;
  var __NAME_COMPUTATION_MAX_DEPTH = 40;

  // -------------------------------------------------------------------------
  // Optional per-run performance counters (debug/benchmark only)
  // -------------------------------------------------------------------------
  const __perfEnabled = !!(opts && opts.perfStats);
  const __perf = __perfEnabled ? { enabled: true, counters: Object.create(null) } : null;

  function __perfInc(key, n) {
    if (!__perfEnabled || !__perf) return;
    const k = String(key);
    const add = n == null ? 1 : Number(n) || 0;
    __perf.counters[k] = (__perf.counters[k] || 0) + add;
  }

  function getPerfStats() {
    if (!__perfEnabled || !__perf) return { enabled: false, counters: {} };
    // Return a shallow copy to prevent accidental mutation by callers
    return { enabled: true, counters: { ...__perf.counters } };
  }

  function resetPerfStats() {
    if (!__perfEnabled || !__perf) return;
    __perf.counters = Object.create(null);
  }

  // -------------------------------------------------------------------------
  // Shared escaping helpers (reduce per-call allocations, deterministic)
  // -------------------------------------------------------------------------
  const __w = realmWindow || window;
  const __cssEscapeSafe = (s) => {
    try {
      return __w && __w.CSS && typeof __w.CSS.escape === 'function'
        ? __w.CSS.escape(String(s))
        : String(s);
    } catch {
      return String(s);
    }
  };
  // Spec-accurate CSS.escape() fallback (CSSOM "serialize an identifier"
  // algorithm) for environments without a native window.CSS.escape, such
  // as jsdom. Must handle CSS identifiers that start with a digit or a
  // hyphen+digit (e.g. UUID-style element IDs): an unescaped leading digit
  // makes the selector fragment invalid CSS, so buildSelectorUncached's
  // el.matches(candidate) verification throws (silently caught) and the
  // selector degrades to a bare tag name, losing all positional/uniqueness
  // information.
  function __cssEscapeIdentFallback(value) {
    const string = String(value);
    const length = string.length;
    const firstCodeUnit = string.charCodeAt(0);
    if (length === 1 && firstCodeUnit === 0x002d) return '\\' + string;
    let result = '';
    for (let index = 0; index < length; index++) {
      const codeUnit = string.charCodeAt(index);
      if (codeUnit === 0x0000) {
        result += '\uFFFD';
        continue;
      }
      if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
        codeUnit === 0x007f ||
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d)
      ) {
        result += '\\' + codeUnit.toString(16) + ' ';
        continue;
      }
      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002d ||
        codeUnit === 0x005f ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a)
      ) {
        result += string.charAt(index);
        continue;
      }
      result += '\\' + string.charAt(index);
    }
    return result;
  }
  const __cssEscapeIdent = (s) => {
    try {
      if (__w && __w.CSS && typeof __w.CSS.escape === 'function') return __w.CSS.escape(String(s));
    } catch {}
    return __cssEscapeIdentFallback(s);
  };
  const __escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // --- eligibility utilities ---
  const isElement = (n) => !!n && n.nodeType === 1;
  const computedStyle = (el) => {
    // Per-run memoization scoped by *helper scope* (root/document), to ensure
    // style caching does not bleed across helper instances with different roots.
    // This aligns with eligibility cache scoping semantics locked by checks.
    const scope = __getScopeObj();

    let map = null;

    try {
      if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
        map = __computedStyleCacheByScope.get(scope) || null;
        if (map && map.has(el)) {
          __perfInc('computedStyle.hit');
          const c = map.get(el);
          return c && typeof c === 'object' ? c : {};
        }
      }
    } catch {
      /* ignore */
    }

    __perfInc('computedStyle.miss');
    let cs;
    try {
      const w = realmWindow || window;
      cs = w && w.getComputedStyle ? w.getComputedStyle(el) : (el && el.style) || {};
    } catch {
      cs = {};
    }

    try {
      if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
        if (!map) {
          map = __computedStyleCacheByScope.get(scope) || null;
          if (!map) {
            map = new WeakMap();
            __computedStyleCacheByScope.set(scope, map);
          }
        }
        map.set(el, cs);
      }
    } catch {
      __perfInc('computedStyle.nocache');
    }

    return cs && typeof cs === 'object' ? cs : {};
  };

  const getOpenModalDialogs = () => {
    // Per-run memoization of open modal dialogs (document-scoped).
    // Safe under engine constraints (no DOM mutation during a run); deterministic.
    if (!document || !document.querySelectorAll) return [];
    if (!__openModalDialogsByDoc) {
      __perfInc('modalDialogs.nocache');
    }
    try {
      if (__openModalDialogsByDoc) {
        const cached = __openModalDialogsByDoc.get(document);
        if (cached) {
          __perfInc('modalDialogs.hit');
          return cached;
        }
        __perfInc('modalDialogs.miss');
      }
    } catch {
      __perfInc('modalDialogs.nocache');
    }

    let list = [];
    try {
      const nl = document.querySelectorAll('dialog[open][aria-modal="true"]');
      // Preserve document order, avoid Array.from allocation where possible.
      for (const el of nl) list.push(el);
    } catch {
      list = [];
    }

    try {
      if (__openModalDialogsByDoc) __openModalDialogsByDoc.set(document, list);
    } catch {
      /* ignore */
    }

    return list;
  };

  // Flat-tree (composed) parent: a distributed/slotted node's real rendered
  // parent is the <slot> it's assigned to, NOT its own light-DOM parentNode
  // (parentNode is unaffected by slot assignment and stays truthy for any
  // normally-connected slotted element). Checking parentNode first would mean
  // the assignedSlot branch never fires for the common case of a real,
  // connected slotted child, silently treating it as if it rendered under
  // its light-DOM parent instead of the shadow-tree container it's actually
  // distributed into. assignedSlot must be checked first; parentNode only
  // applies to nodes that aren't currently distributed through a slot. Once
  // climbing reaches a ShadowRoot itself (parentNode is null there), `.host`
  // is the shadow host element directly, not `getRootNode({composed:true})`, which
  // resolves all the way to the top-level document, skipping past the
  // immediate shadow boundary this function is trying to climb out of one
  // level at a time.
  const composedParent = (n) => {
    if (!n) return null;
    if (n.assignedSlot) return n.assignedSlot;
    if (n.parentNode) return n.parentNode;
    return n.host || null;
  };
  const ancestorsIncludingSelf = (n) => {
    if (!n) return [];
    // Cache ancestor chains per node, per run, to avoid repeated composed-parent walks.
    // Deterministic: purely memoized within the current run, no cross-run persistence.
    try {
      if (
        __ancestorsIncludingSelfCache &&
        typeof __ancestorsIncludingSelfCache.get === 'function'
      ) {
        const cached = __ancestorsIncludingSelfCache.get(n);
        if (cached) {
          __perfInc('ancestorsIncludingSelf.hit');
          return cached;
        }
        __perfInc('ancestorsIncludingSelf.miss');
        const out = [];
        let cur = n,
          guard = 0;
        while (cur && guard++ < 200) {
          out.push(cur);
          cur = composedParent(cur);
        }
        // Still more to walk: callers must not read "no blocking ancestor
        // found" from a chain that never reached the root.
        if (cur) {
          out.truncated = true;
          __perfInc('ancestorsIncludingSelf.truncated');
        }
        __ancestorsIncludingSelfCache.set(n, out);
        return out;
      }
    } catch {
      /* fall through */
    }

    __perfInc('ancestorsIncludingSelf.nocache');
    const out = [];
    let cur = n,
      guard = 0;
    while (cur && guard++ < 200) {
      out.push(cur);
      cur = composedParent(cur);
    }
    if (cur) {
      out.truncated = true;
      __perfInc('ancestorsIncludingSelf.truncated');
    }
    return out;
  };

  // Whether the 200-step ancestor walk for this node stopped short of the
  // root. A rule cannot see this, so normalization uses it to decide how much
  // confidence an occurrence on that node deserves.
  function hasTruncatedAncestorWalk(node) {
    try {
      if (!node || typeof node !== 'object') return false;
      return ancestorsIncludingSelf(node).truncated === true;
    } catch {
      return false;
    }
  }

  function getClosestMap(el) {
    try {
      if (!isElement(el)) return null;
      return el.closest ? el.closest('map') : null;
    } catch {
      return null;
    }
  }

  function hasBlockingInert(node) {
    // Default behavior: inert anywhere in ancestorsIncludingSelf blocks.
    if (!isElement(node)) return false;

    const tag = (node.tagName || '').toLowerCase();
    const isArea = tag === 'area';

    let mapEl = null;
    if (isArea) mapEl = getClosestMap(node);

    const chain = ancestorsIncludingSelf(node);

    for (const a of chain) {
      if (!isElement(a)) continue;

      // Exception: for <area>, inert on itself or on its <map> does NOT block
      if (isArea) {
        if (a === node) continue; // ignore <area inert>
        if (mapEl && a === mapEl) continue; // ignore <map inert>
      }

      if (a.hasAttribute && a.hasAttribute('inert')) return true;
    }
    return false;
  }

  const trim = (v) => (v == null ? '' : String(v)).trim();

  const getAttr = (el, name) => {
    try {
      return el && el.getAttribute ? el.getAttribute(name) : null;
    } catch {
      return null;
    }
  };

  function parseTabIndex(el) {
    const raw = getAttr(el, 'tabindex');
    const t = trim(raw);
    if (raw == null || t === '') return { has: false, value: null, valid: false };
    const n = Number(t);
    if (Number.isNaN(n)) return { has: true, value: null, valid: false };
    return { has: true, value: n, valid: true };
  }

  function getPlatformFocusability(el) {
    // Per-run memoization (WeakMap<Element, Result>)
    try {
      if (__focusabilityCache && el && typeof el === 'object' && __focusabilityCache.has(el)) {
        __perfInc('focusability.hit');
        const c = __focusabilityCache.get(el);
        if (c && typeof c === 'object') {
          return {
            focusable: !!c.focusable,
            tabbable: !!c.tabbable,
            mechanism: c.mechanism || 'none',
            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
          };
        }
      }
    } catch {}

    __perfInc('focusability.miss');
    let result;

    if (!isElement(el)) {
      result = { focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement'] };
    } else if (hasBlockingInert(el)) {
      result = { focusable: false, tabbable: false, mechanism: 'none', flags: ['inert'] };
    } else {
      const flags = [];
      const disabled = !!(el.matches && el.matches(':disabled'));
      if (disabled) {
        result = { focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled'] };
      } else {
        const ti = parseTabIndex(el);
        if (ti.has) {
          if (!ti.valid)
            result = {
              focusable: false,
              tabbable: false,
              mechanism: 'tabindex',
              flags: ['tabindex-invalid']
            };
          else if (ti.value < 0)
            result = {
              focusable: true,
              tabbable: false,
              mechanism: 'tabindex',
              flags: ['tabindex-negative']
            };
          else
            result = {
              focusable: true,
              tabbable: true,
              mechanism: 'tabindex',
              flags: ['tabindex-nonnegative']
            };
        } else {
          // native focusability
          const native = isPlatformFocusable(el); // uses your existing boolean logic
          if (native) result = { focusable: true, tabbable: true, mechanism: 'native', flags };
          else result = { focusable: false, tabbable: false, mechanism: 'none', flags };
        }
      }
    }

    try {
      if (__focusabilityCache && el && typeof el === 'object') {
        __focusabilityCache.set(el, {
          focusable: !!result.focusable,
          tabbable: !!result.tabbable,
          mechanism: result.mechanism || 'none',
          flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
        });
      }
    } catch {}

    return {
      focusable: !!result.focusable,
      tabbable: !!result.tabbable,
      mechanism: result.mechanism || 'none',
      flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
    };
  }

  // --- attribute ---
  function getAttributeInfo(el, attr) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const attrValue = trim(getAttr(el, attr));
    if (!attrValue) return { present: false, value: '', mechanism: attr, flags: ['empty'] };

    return { present: true, value: attrValue, mechanism: attr, flags };
  }

  // --- ARIA name primitives (reusable across checks) ---
  function getAriaLabelInfo(el) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const ariaLabel = trim(getAttr(el, 'aria-label'));
    if (!ariaLabel) return { present: false, value: '', mechanism: 'aria-label', flags: ['empty'] };

    return { present: true, value: ariaLabel, mechanism: 'aria-label', flags };
  }

  function getAriaLabelledByInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
    if (!ariaLabelledBy)
      return { present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing'] };

    const t = getTextFromIdRefs(ariaLabelledBy, _ctx, opts);
    for (const f of t.flags) flags.push(f);

    if (!t.text) flags.push('empty');

    return {
      present: !!t.text,
      value: t.text || '',
      mechanism: 'aria-labelledby',
      refsCount: t.refsCount,
      missing: t.missing ? t.missing.slice(0) : [],
      flags
    };
  }

  /**
   * getAriaNameInfo: ARIA-only name, with correct precedence.
   * aria-labelledby (if non-empty) wins over aria-label.
   */
  function getAriaNameInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const lb = getAriaLabelledByInfo(el, _ctx, opts);
    if (lb.present && lb.value)
      return {
        present: true,
        value: lb.value,
        mechanism: 'aria-labelledby',
        flags: flags.concat(lb.flags || [])
      };

    const al = getAriaLabelInfo(el);
    if (al.present && al.value)
      return {
        present: true,
        value: al.value,
        mechanism: 'aria-label',
        flags: flags.concat(al.flags || [])
      };

    // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
    if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
    if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label')))
      flags.push('aria-label-empty');

    return { present: false, value: '', mechanism: 'none', flags };
  }

  // Landmark-role naming (nav/main/region/banner/contentinfo/etc.): these
  // roles don't derive a name from content (unlike a button/link), so per
  // the accname spec their only sources are aria-label, aria-labelledby,
  // then a title-attribute fallback. Shared by the 7 landmark rule files
  // (landmark-unique, landmark-no-duplicate-banner/-contentinfo,
  // landmark-banner/-main/-contentinfo-is-top-level, region); title must
  // be included, otherwise e.g. two <nav>s distinguished only by
  // title="navigation" are both seen as unnamed and flagged as duplicates.
  function getLandmarkNameInfo(el, ctx) {
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const aria = getAriaNameInfo(el, ctx);
    if (aria.present && aria.value) return aria;

    const title = trim(getAttr(el, 'title'));
    if (title) return { present: true, value: title, mechanism: 'title', flags: aria.flags || [] };

    return {
      present: false,
      value: '',
      mechanism: 'none',
      flags: (aria.flags || []).concat(
        title === '' && getAttr(el, 'title') != null ? ['title-empty'] : []
      )
    };
  }

  const lower = (v) => trim(v).toLowerCase();

  const safeDocGetById = (id) => {
    const key = trim(id);
    if (!key) return null;

    // Shared cache (per run)
    try {
      if (__idLookupDocCache && __idLookupDocCache.has(key)) {
        __perfInc('idLookup.doc.hit');
        return __idLookupDocCache.get(key) || null;
      }
    } catch {}

    __perfInc('idLookup.doc.miss');
    let el = null;
    try {
      if (document && document.getElementById) el = document.getElementById(key);
    } catch {
      el = null;
    }

    try {
      if (__idLookupDocCache) __idLookupDocCache.set(key, el || null);
    } catch {}

    return el || null;
  };

  const safeRootQueryById = (id) => {
    // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
    // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
    // With multi-region contextSelector, tries each root in turn and
    // returns the first match -- IDs are meant to be document-unique
    // anyway, so at most one root should ever actually contain it.
    const key = trim(id);
    if (!key) return null;
    if (!roots.length) return null;

    try {
      const cacheKey = '#' + key;
      if (__idLookupRootCache && __idLookupRootCache.has(cacheKey)) {
        __perfInc('idLookup.root.hit');
        return __idLookupRootCache.get(cacheKey) || null;
      }
    } catch {}

    __perfInc('idLookup.root.miss');
    let el = null;
    for (const r of roots) {
      if (!r || !r.querySelector) continue;
      try {
        el = r.querySelector('#' + key);
      } catch {
        el = null;
      }
      if (el) break;
    }

    try {
      const cacheKey = '#' + key;
      if (__idLookupRootCache) __idLookupRootCache.set(cacheKey, el || null);
    } catch {}

    return el || null;
  };

  function inClosedDetailsContent(node) {
    try {
      if (!isElement(node)) return false;
      const summary = node.closest && node.closest('summary');
      if (summary && summary.contains(node)) return false;
      // closest() matches the node itself, so a plain <details> element
      // being asked about its own eligibility would otherwise match its
      // own closest('details') and get judged against its own open state.
      // A closed <details> only hides its extra content, not the <details>
      // element (or its <summary>) that stays on the page as the toggle.
      const details = node.closest && node.closest('details');
      if (details && details !== node && !details.hasAttribute('open')) return true;
    } catch {}
    return false;
  }

  function isPlatformFocusable(el) {
    if (!isElement(el) || hasBlockingInert(el)) return false;
    const tag = (el.tagName || '').toLowerCase();
    const type = (el.getAttribute && (el.getAttribute('type') || '').toLowerCase()) || '';
    const disabled = !!(el.matches && el.matches(':disabled'));
    if (disabled) return false;

    if (tag === 'a') {
      const href = el.getAttribute && el.getAttribute('href');
      if (href && href.trim()) return true;
    }
    if (tag === 'area') {
      // Engine policy: treat <area> as focusable when it's part of a *used* image map.
      const map = getClosestMap(el);
      if (map) {
        const rawName = (
          map.getAttribute &&
          (map.getAttribute('name') || map.getAttribute('id') || '')
        ).trim();
        if (rawName && document && document.querySelector) {
          const esc = __cssEscapeSafe;
          const n = esc(rawName);

          // Be practical: accept both "#name" and "name", and ignore case.
          const sels = [`img[usemap="#${n}" i]`, `img[usemap="${n}" i]`];

          for (const sel of sels) {
            try {
              if (document.querySelector(sel)) return true;
            } catch {}
          }
        }
      }
    }
    if (tag === 'input') {
      if (type !== 'hidden') return true;
    }
    if (tag === 'select' || tag === 'textarea' || tag === 'button' || tag === 'summary')
      return true;
    if (el.hasAttribute && el.hasAttribute('contenteditable')) {
      // contenteditable="false" explicitly disables the editing host
      // and does not by itself add the element to the tab order.
      const ceVal = lower(getAttr(el, 'contenteditable'));
      if (ceVal !== 'false') return true;
    }

    const tabindex = el.getAttribute && el.getAttribute('tabindex');
    if (tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(tabindex)))
      return true;

    return false;
  }

  function getIdRefReverseIndex(scopeObj) {
    // Reverse index: id token -> referencing elements (aria-labelledby / aria-describedby)
    // Built once per scope per run. Deterministic: querySelectorAll order is document order.
    if (!scopeObj || !scopeObj.querySelectorAll) return null;

    if (!__idRefReverseIndexByScope) {
      __perfInc('idrefReverseIndex.nocache');
      return null;
    }

    try {
      const cached = __idRefReverseIndexByScope.get(scopeObj);
      if (cached) {
        __perfInc('idrefReverseIndex.hit');
        return cached;
      }
    } catch {
      __perfInc('idrefReverseIndex.nocache');
      return null;
    }

    __perfInc('idrefReverseIndex.miss');

    const idx = new Map();
    let refs;
    try {
      refs = Array.from(scopeObj.querySelectorAll('[aria-labelledby],[aria-describedby]'));
    } catch {
      refs = [];
    }

    for (const el of refs) {
      if (!isElement(el)) continue;

      // Parse tokens deterministically
      const lb = trim(getAttr(el, 'aria-labelledby'));
      const db = trim(getAttr(el, 'aria-describedby'));

      // Avoid pushing same element twice for the same token when both attrs contain it.
      const pushed = new Set();

      if (lb) {
        const parts = lb.split(/\s+/).filter(Boolean);
        for (const t of parts) {
          const tok = trim(t);
          if (!tok || pushed.has(tok)) continue;
          pushed.add(tok);
          const arr = idx.get(tok);
          if (arr) arr.push(el);
          else idx.set(tok, [el]);
        }
      }

      if (db) {
        const parts = db.split(/\s+/).filter(Boolean);
        for (const t of parts) {
          const tok = trim(t);
          if (!tok || pushed.has(tok)) continue;
          pushed.add(tok);
          const arr = idx.get(tok);
          if (arr) arr.push(el);
          else idx.set(tok, [el]);
        }
      }
    }

    try {
      __idRefReverseIndexByScope.set(scopeObj, idx);
      __perfInc('idrefReverseIndex.build');
    } catch {
      // ignore cache set errors
    }

    return idx;
  }

  function isReferencedByVisibleIdRef(node) {
    if (!document || !isElement(node)) return false;
    const id = node.getAttribute && node.getAttribute('id');
    const idTok = id && id.trim ? id.trim() : '';
    if (!idTok) return false;

    // Prefer reverse-index lookup (single build per run) over repeated querySelectorAll per node.
    const idx = getIdRefReverseIndex(document);
    if (idx && typeof idx.get === 'function') {
      let refs;
      try {
        refs = idx.get(idTok) || null;
      } catch {
        refs = null;
      }
      if (refs && refs.length) {
        for (const ref of refs) {
          if (!isElement(ref)) continue;
          const elig = isAccTreeEligible(ref); // safe recursion
          if (elig && elig.eligible) return true;
        }
        return false;
      }
      // If index exists but no references, short-circuit.
      return false;
    }

    // Fallback to querySelectorAll when cache is unavailable.
    const esc = __cssEscapeSafe;
    const idSel = esc(idTok);
    let refs;
    try {
      refs = [
        ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
        ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]'))
      ];
    } catch {
      refs = [];
    }
    for (const ref of refs) {
      if (!isElement(ref)) continue;
      const elig = isAccTreeEligible(ref); // safe recursion
      if (elig && elig.eligible) return true;
    }
    return false;
  }

  function isExcluded(el) {
    const eff = __getEffectiveExcludeSelectors();
    if (!eff.length || !el || !el.closest) return false;
    try {
      return eff.some((sel) => !!el.closest(sel));
    } catch {
      return false;
    }
  }

  function queryAll(sel) {
    if (!roots.length) return [];
    const out = [];
    const seen = new Set();
    // Per root: self-match first (matching the original single-root
    // ordering), then descendants, deduped across all roots -- matters
    // when multiple contextSelector regions overlap/nest, so an element
    // reachable from more than one root is only ever reported once.
    for (const r of roots) {
      if (!r) continue;
      // querySelectorAll never returns its own context node, only
      // descendants, so an attribute/role selector can never match `r`
      // itself this way. In the default (unscoped) case `r` is
      // `document.documentElement` (the <html> element), so without this
      // self-match every rule using this helper would be blind to an issue
      // asserted directly on <html> (e.g. `<html role="...">`, `[lang]`,
      // any `[aria-*]`).
      if (r.nodeType === 1 && typeof r.matches === 'function' && !seen.has(r)) {
        try {
          if (r.matches(sel)) {
            seen.add(r);
            out.push(r);
          }
        } catch {}
      }
      try {
        const list = r.querySelectorAll(sel);
        for (const el of list) {
          if (el && !seen.has(el)) {
            seen.add(el);
            out.push(el);
          }
        }
      } catch {
        // skip this root, keep results from the others
      }
    }
    return out;
  }

  function queryAllDeep(sel) {
    if (!roots.length) return [];
    // Performance note:
    // Avoid the old "querySelectorAll('*')" approach which is O(N) per shadow host
    // and explodes on huge DOMs. Instead, walk shadow roots only and run the selector
    // in each root once. This keeps work proportional to the number of shadow roots.
    const results = [];
    const seen = new Set();
    const visitedRoots = new Set();

    const pushMatches = (scope) => {
      if (!scope || !scope.querySelectorAll) return;
      let els;
      try {
        els = scope.querySelectorAll(sel);
      } catch {
        els = [];
      }
      // NodeList is iterable; avoid Array.from to reduce allocations.
      for (const el of els) {
        if (el && !seen.has(el) && !isExcluded(el)) {
          seen.add(el);
          results.push(el);
        }
      }
      // Same root-self-match gap as queryAll above: querySelectorAll
      // never returns `scope` itself, so a shadow-root host element
      // (or the top-level <html> root) matching `sel` directly would
      // otherwise be invisible here too.
      if (
        scope.nodeType === 1 &&
        typeof scope.matches === 'function' &&
        !seen.has(scope) &&
        !isExcluded(scope)
      ) {
        try {
          if (scope.matches(sel)) {
            seen.add(scope);
            results.push(scope);
          }
        } catch {}
      }
    };

    const collectShadowRoots = (scope) => {
      if (!scope || !scope.querySelectorAll) return [];

      // Cache shadow root discovery per root to avoid repeated querySelectorAll('*') walks.
      // IMPORTANT: do not cache when the effective exclude list (global
      // ∪ active rule-scoped excludes) is non-empty -- different rules
      // may have different effective lists and must not share results.
      if (!__getEffectiveExcludeSelectors().length && __shadowRootsByRoot) {
        try {
          const cached = __shadowRootsByRoot.get(scope);
          if (cached) {
            __perfInc('shadowRoots.hit');
            return cached;
          }
          __perfInc('shadowRoots.miss');

          let hosts = [];
          try {
            hosts = scope.querySelectorAll('*');
          } catch {
            hosts = [];
          }

          const roots = [];
          for (const el of hosts) {
            if (!el || el.nodeType !== 1) continue;
            const sr = el.shadowRoot;
            if (sr) roots.push(sr);
          }

          try {
            __shadowRootsByRoot.set(scope, roots);
          } catch {
            __perfInc('shadowRoots.nocache');
          }
          return roots;
        } catch {
          __perfInc('shadowRoots.nocache');
          // fall through to uncached path
        }
      } else {
        __perfInc('shadowRoots.nocache');
      }

      // Uncached path (preserves excludeSelectors filtering semantics).
      let hosts;
      try {
        hosts = scope.querySelectorAll('*');
      } catch {
        hosts = [];
      }
      const roots = [];
      for (const el of hosts) {
        if (!el || el.nodeType !== 1) continue;
        if (isExcluded(el)) continue;
        const sr = el.shadowRoot;
        if (sr) roots.push(sr);
      }
      return roots;
    };

    // Seed the BFS queue with every resolved context root (not just one)
    // -- the existing shadow-root discovery loop below already
    // generalizes to multiple starting points without further changes,
    // since it was already a growing queue, not a single fixed root.
    const q = roots.slice();
    for (let qi = 0; qi < q.length; qi++) {
      const curRoot = q[qi];
      if (!curRoot || visitedRoots.has(curRoot)) continue;
      visitedRoots.add(curRoot);

      pushMatches(curRoot);

      const childShadowRoots = collectShadowRoots(curRoot);
      for (const sr of childShadowRoots) q.push(sr);
    }

    return results;
  }

  const HARD_HIDDEN_REASONS = new Set([
    'displayNone',
    'hiddenAttr',
    'detailsClosed',
    'templateContent',
    'nonRenderedElement',
    'inputHidden',
    'visibilityHidden',
    'contentVisibilityHidden'
  ]);

  function queryAllSmart(sel) {
    let list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);

    // Global hidden-content policy: skip nodes that are fully excluded from
    // rendered visibility by default (unless includeHiddenElements:true).
    if (!includeHiddenElements) {
      list = list.filter((el) => {
        try {
          const vis = isAccTreeEligible(el);
          if (!vis || vis.eligible !== false) return true;
          const reasons = Array.isArray(vis.reasons) ? vis.reasons : [];
          for (const r of reasons) {
            if (HARD_HIDDEN_REASONS.has(r)) return false;
          }

          // `isAccTreeEligible` can short-circuit on an inert ancestor
          // before it reaches an outer hard-hidden ancestor (e.g.
          // display:none wrapper). In that case the node is still
          // structurally hidden and should be excluded by the default
          // hidden-content policy.
          if (reasons.includes('inert')) {
            const domVis = isDomVisibleEligible(el, null, {
              visibilityMode: 'styleOnly',
              disableGeometry: true,
              ignoreOpacity: true
            });
            const domReasons = Array.isArray(domVis && domVis.reasons) ? domVis.reasons : [];
            for (const r of domReasons) {
              if (HARD_HIDDEN_REASONS.has(r)) return false;
            }
          }
          return true;
        } catch {
          return true;
        }
      });
    }

    return __getEffectiveExcludeSelectors().length ? list.filter((el) => !isExcluded(el)) : list;
  }

  // -------------------------------------------------------------------------
  // Per-run shared caches (DOM helpers)
  // -------------------------------------------------------------------------
  try {
    const w =
      realmWindow ||
      (document && document.defaultView) ||
      (typeof global !== 'undefined' && global.window ? global.window : null);

    if (w) {
      if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
      if (!w.__a11ycoreSharedCache.dom) w.__a11ycoreSharedCache.dom = {};
      __domSharedCache = w.__a11ycoreSharedCache.dom;
    }
  } catch {
    __domSharedCache = {};
  }

  // Selector cache (per element), partitioned by __selectorOptsKey since
  // built selectors depend on includeShadowDom/excludeSelectors.
  try {
    __selectorCache =
      __domSharedCache.selectorCache instanceof Map
        ? __domSharedCache.selectorCache
        : (__domSharedCache.selectorCache = new Map());
  } catch {
    __selectorCache = null;
  }

  function __getSelectorCacheForOpts() {
    if (!__selectorCache) return null;
    try {
      const key = __getSelectorOptsKey();
      let wm = __selectorCache.get(key);
      if (!(wm instanceof WeakMap)) {
        wm = new WeakMap();
        __selectorCache.set(key, wm);
      }
      return wm;
    } catch {
      return null;
    }
  }

  try {
    __outerHtmlCache =
      __domSharedCache.outerHtmlCache instanceof WeakMap
        ? __domSharedCache.outerHtmlCache
        : (__domSharedCache.outerHtmlCache = new WeakMap());
  } catch {
    __outerHtmlCache = null;
  }

  // ID lookups: cache getElementById / root.querySelector(#id) results within a run
  try {
    __idLookupDocCache =
      __domSharedCache.idLookupDocCache instanceof Map
        ? __domSharedCache.idLookupDocCache
        : (__domSharedCache.idLookupDocCache = new Map());
  } catch {
    __idLookupDocCache = null;
  }

  try {
    __idLookupRootCache =
      __domSharedCache.idLookupRootCache instanceof Map
        ? __domSharedCache.idLookupRootCache
        : (__domSharedCache.idLookupRootCache = new Map());
  } catch {
    __idLookupRootCache = null;
  }

  // IDREF resolution: cache resolveIdRefs results (root-scoped) within a run
  try {
    __idRefCacheByRoot =
      __domSharedCache.idRefCacheByRoot instanceof WeakMap
        ? __domSharedCache.idRefCacheByRoot
        : (__domSharedCache.idRefCacheByRoot = new WeakMap());
  } catch {
    __idRefCacheByRoot = null;
  }

  // Reverse index for aria-labelledby/aria-describedby -> id token
  try {
    __idRefReverseIndexByScope =
      __domSharedCache.idRefReverseIndexByScope instanceof WeakMap
        ? __domSharedCache.idRefReverseIndexByScope
        : (__domSharedCache.idRefReverseIndexByScope = new WeakMap());
  } catch {
    __idRefReverseIndexByScope = null;
  }

  // Selector uniqueness index (per scope) within a run
  try {
    __uniqIndexByScope =
      __domSharedCache.uniqIndexByScope instanceof WeakMap
        ? __domSharedCache.uniqIndexByScope
        : (__domSharedCache.uniqIndexByScope = new WeakMap());
  } catch {
    __uniqIndexByScope = null;
  }

  // Shadow root discovery cache (per root) within a run.
  // Only used when excludeSelectors is empty to avoid cross-helper bleed.
  try {
    __shadowRootsByRoot =
      __domSharedCache.shadowRootsByRoot instanceof WeakMap
        ? __domSharedCache.shadowRootsByRoot
        : (__domSharedCache.shadowRootsByRoot = new WeakMap());
  } catch {
    __shadowRootsByRoot = null;
  }

  // -------------------------------------------------------------------------
  // Additional per-run caches (eligibility / focusability / labeling)
  // -------------------------------------------------------------------------
  let __ancestorsIncludingSelfCache = null;
  let __eligibilityAccCache = null;
  let __eligibilityDomCacheByMode = null; // Map<string, WeakMap<Element, Result>>
  let __focusabilityCache = null;
  let __visibilityHintsCache = null; // WeakMap<Element, {hints:Array<string>, metrics:object}>
  let __computedStyleCacheByScope = null; // WeakMap<object, WeakMap<Element, CSSStyleDeclaration|object>>
  let __openModalDialogsByDoc = null; // WeakMap<Document, Array<Element>>
  let __ancestorBlockerAccByScope = null; // WeakMap<object, WeakMap<Element, {struct:string|null, css:string|null}>>
  let __ancestorBlockerDomByScope = null; // WeakMap<object, WeakMap<Element, {struct, css, cssKnown, visibility, contentVisHidden, opacity}>>
  let __ancestorBlockerDomStructFinalByScope = null; // WeakMap<object, WeakMap<Element, string|null>> (final structural blocker per element per scope)
  let __labelAssociationCache = null;
  let __labelMethodCache = null;
  let __labelElementsByForIdIndexByDoc = null; // WeakMap<Document, Map<string, Element[]>> (label[for] by id -> real elements, see getAssociatedLabelElements)
  // Map<string, WeakMap<Element, Info>>. Only names computed at
  // __nameComputationDepth 0 are stored: a name computed deeper is the value
  // that traversal saw, not the element's own. Resolving an aria-labelledby
  // that points back at an ancestor re-enters the element, the cycle guard
  // returns '' for that inner visit, and caching it would hand '' to whoever
  // asked next -- so which rule ran first decided the answer.
  let __accessibleNameCacheByKey = null;
  let __accessibleDescCacheByKey = null; // Map<string, WeakMap<Element, Info>>

  try {
    __ancestorsIncludingSelfCache =
      __domSharedCache.ancestorsIncludingSelfCache instanceof WeakMap
        ? __domSharedCache.ancestorsIncludingSelfCache
        : (__domSharedCache.ancestorsIncludingSelfCache = new WeakMap());
  } catch {
    __ancestorsIncludingSelfCache = null;
  }

  try {
    __eligibilityAccCache =
      __domSharedCache.eligibilityAccCache instanceof WeakMap
        ? __domSharedCache.eligibilityAccCache
        : (__domSharedCache.eligibilityAccCache = new WeakMap());
  } catch {
    __eligibilityAccCache = null;
  }

  try {
    __eligibilityDomCacheByMode =
      __domSharedCache.eligibilityDomCacheByMode instanceof Map
        ? __domSharedCache.eligibilityDomCacheByMode
        : (__domSharedCache.eligibilityDomCacheByMode = new Map());
  } catch {
    __eligibilityDomCacheByMode = null;
  }

  try {
    __focusabilityCache =
      __domSharedCache.focusabilityCache instanceof WeakMap
        ? __domSharedCache.focusabilityCache
        : (__domSharedCache.focusabilityCache = new WeakMap());
  } catch {
    __focusabilityCache = null;
  }

  try {
    __visibilityHintsCache =
      __domSharedCache.visibilityHintsCache instanceof WeakMap
        ? __domSharedCache.visibilityHintsCache
        : (__domSharedCache.visibilityHintsCache = new WeakMap());
  } catch {
    __visibilityHintsCache = null;
  }

  try {
    __computedStyleCacheByScope =
      __domSharedCache.computedStyleCacheByScope instanceof WeakMap
        ? __domSharedCache.computedStyleCacheByScope
        : (__domSharedCache.computedStyleCacheByScope = new WeakMap());
  } catch {
    __computedStyleCacheByScope = null;
  }

  try {
    __openModalDialogsByDoc =
      __domSharedCache.openModalDialogsByDoc instanceof WeakMap
        ? __domSharedCache.openModalDialogsByDoc
        : (__domSharedCache.openModalDialogsByDoc = new WeakMap());
  } catch {
    __openModalDialogsByDoc = null;
  }

  try {
    __ancestorBlockerAccByScope =
      __domSharedCache.ancestorBlockerAccByScope instanceof WeakMap
        ? __domSharedCache.ancestorBlockerAccByScope
        : (__domSharedCache.ancestorBlockerAccByScope = new WeakMap());
  } catch {
    __ancestorBlockerAccByScope = null;
  }

  try {
    __ancestorBlockerDomByScope =
      __domSharedCache.ancestorBlockerDomByScope instanceof WeakMap
        ? __domSharedCache.ancestorBlockerDomByScope
        : (__domSharedCache.ancestorBlockerDomByScope = new WeakMap());
  } catch {
    __ancestorBlockerDomByScope = null;
  }

  try {
    __ancestorBlockerDomStructFinalByScope =
      __domSharedCache.ancestorBlockerDomStructFinalByScope instanceof WeakMap
        ? __domSharedCache.ancestorBlockerDomStructFinalByScope
        : (__domSharedCache.ancestorBlockerDomStructFinalByScope = new WeakMap());
  } catch {
    __ancestorBlockerDomStructFinalByScope = null;
  }

  try {
    __labelAssociationCache =
      __domSharedCache.labelAssociationCache instanceof WeakMap
        ? __domSharedCache.labelAssociationCache
        : (__domSharedCache.labelAssociationCache = new WeakMap());
  } catch {
    __labelAssociationCache = null;
  }

  try {
    __labelMethodCache =
      __domSharedCache.labelMethodCache instanceof WeakMap
        ? __domSharedCache.labelMethodCache
        : (__domSharedCache.labelMethodCache = new WeakMap());
  } catch {
    __labelMethodCache = null;
  }

  try {
    __labelElementsByForIdIndexByDoc =
      __domSharedCache.labelElementsByForIdIndexByDoc instanceof WeakMap
        ? __domSharedCache.labelElementsByForIdIndexByDoc
        : (__domSharedCache.labelElementsByForIdIndexByDoc = new WeakMap());
  } catch {
    __labelElementsByForIdIndexByDoc = null;
  }

  try {
    __accessibleNameCacheByKey =
      __domSharedCache.accessibleNameCacheByKey instanceof Map
        ? __domSharedCache.accessibleNameCacheByKey
        : (__domSharedCache.accessibleNameCacheByKey = new Map());
  } catch {
    __accessibleNameCacheByKey = null;
  }

  try {
    __accessibleDescCacheByKey =
      __domSharedCache.accessibleDescCacheByKey instanceof Map
        ? __domSharedCache.accessibleDescCacheByKey
        : (__domSharedCache.accessibleDescCacheByKey = new Map());
  } catch {
    __accessibleDescCacheByKey = null;
  }

  function __getScopeObj() {
    // Purely a cache-partition key -- doesn't need to BE a real scan
    // scope, just a value that's stable for this run and distinct across
    // runs with a different root set. `roots` itself (the array) is a
    // stable reference for the whole run when there's more than one.
    if (roots.length === 1) return roots[0];
    if (roots.length > 1) return roots;
    return document && typeof document === 'object' ? document : null;
  }

  // Real `<label for="...">` element references for one `for` value, built
  // via a single `document.querySelectorAll('label[for]')` pass and cached
  // per document for the whole run, for callers that need the actual label
  // element (to compute its accessible name, or to check whether it
  // contributes one), not just whether one exists.
  function __getLabelElementsForId(id) {
    const key = trim(id);
    if (!key || !document || !document.querySelectorAll) return [];

    function buildIndex() {
      const byId = new Map();
      try {
        for (const label of document.querySelectorAll('label[for]')) {
          const forVal = trim(label.getAttribute('for'));
          if (!forVal) continue;
          const bucket = byId.get(forVal);
          if (bucket) bucket.push(label);
          else byId.set(forVal, [label]);
        }
      } catch {}
      return byId;
    }

    if (!__labelElementsByForIdIndexByDoc) return buildIndex().get(key) || [];

    let byId = __labelElementsByForIdIndexByDoc.get(document);
    if (!(byId instanceof Map)) {
      byId = buildIndex();
      __labelElementsByForIdIndexByDoc.set(document, byId);
    }
    return byId.get(key) || [];
  }

  // Tags the HTML label-association algorithm recognizes as "labelable"
  // (https://html.spec.whatwg.org/#category-label), used only to find a
  // wrapping <label>'s FIRST such descendant -- the one it is actually
  // associated with when it carries no `for` attribute.
  const LABELABLE_SELECTOR =
    'input:not([type="hidden"]), select, textarea, button, meter, output, progress';

  // Real `<label>` elements associated with `el`, replicating the native
  // `.labels` API's result (a `<label for="id">` pointing at `el`, plus a
  // wrapping `<label>` with no `for` attribute whose first labelable
  // descendant is `el`) without ever calling `.labels`/`label.control`.
  //
  // Why not just call `.labels`: it's spec-correct, but in this engine's
  // supported Node/jsdom runtime (see tests/node-runtime-parity.test.js),
  // jsdom implements it as a live query that walks the WHOLE document on
  // every access, and for every `<label for>` it passes during that walk,
  // resolves `.control` -- itself ANOTHER whole-document walk to resolve
  // that id (jsdom's form-controls.js getLabelsForLabelable /
  // HTMLLabelElement-impl.js `get control`). Called once per labelable
  // element, that's an O(elements * document size) cost that used to
  // dominate whole engine runs on form-heavy pages -- a real browser
  // maintains an internal id index so `.labels` is cheap there, but jsdom
  // is a real, tested runtime for this engine, not just a benchmark
  // artifact. The `for`-index above (built once per document) plus a
  // bounded `closest('label')` walk answers the same question without it.
  function getAssociatedLabelElements(el) {
    const out = [];
    const id = trim(getAttr(el, 'id'));
    if (id) {
      const forLabels = __getLabelElementsForId(id);
      for (const l of forLabels) out.push(l);
    }
    try {
      const wrap = el.closest ? el.closest('label') : null;
      if (
        wrap &&
        isElement(wrap) &&
        !(wrap.hasAttribute && wrap.hasAttribute('for')) &&
        out.indexOf(wrap) === -1
      ) {
        let firstControl = null;
        try {
          firstControl = wrap.querySelector ? wrap.querySelector(LABELABLE_SELECTOR) : null;
        } catch {
          firstControl = null;
        }
        if (firstControl === el) out.push(wrap);
      }
    } catch {}
    // Usually 0-1 elements; a second only shows up for genuinely unusual
    // markup (both a `for`-labelled AND a wrapping label on one control),
    // where the two lookups above aren't guaranteed to already be in
    // document order relative to each other.
    if (out.length > 1) {
      try {
        out.sort((a, b) => {
          const bits = a.compareDocumentPosition(b);
          if (bits & 4) return -1;
          if (bits & 2) return 1;
          return 0;
        });
      } catch {}
    }
    return out;
  }

  function __getEligibilityAccCacheForScope() {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__domSharedCache) return null;
    try {
      const wmByScope =
        __domSharedCache.eligibilityAccCacheByScope instanceof WeakMap
          ? __domSharedCache.eligibilityAccCacheByScope
          : (__domSharedCache.eligibilityAccCacheByScope = new WeakMap());

      let perScope = wmByScope.get(scopeObj);
      if (!(perScope instanceof WeakMap)) {
        perScope = new WeakMap();
        wmByScope.set(scopeObj, perScope);
      }
      return perScope;
    } catch {
      return null;
    }
  }

  function __getEligibilityDomCacheForScope(modeKey) {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__domSharedCache) return null;
    try {
      const wmByScope =
        __domSharedCache.eligibilityDomCacheByScope instanceof WeakMap
          ? __domSharedCache.eligibilityDomCacheByScope
          : (__domSharedCache.eligibilityDomCacheByScope = new WeakMap());

      let perScopeMap = wmByScope.get(scopeObj);
      if (!(perScopeMap instanceof Map)) {
        perScopeMap = new Map();
        wmByScope.set(scopeObj, perScopeMap);
      }

      let perMode = perScopeMap.get(modeKey);
      if (!(perMode instanceof WeakMap)) {
        perMode = new WeakMap();
        perScopeMap.set(modeKey, perMode);
      }
      return perMode;
    } catch {
      return null;
    }
  }

  function __getAncestorBlockerAccCacheForScope() {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__ancestorBlockerAccByScope) return null;
    try {
      let perScope = __ancestorBlockerAccByScope.get(scopeObj);
      if (!(perScope instanceof WeakMap)) {
        perScope = new WeakMap();
        __ancestorBlockerAccByScope.set(scopeObj, perScope);
      }
      return perScope;
    } catch {
      return null;
    }
  }

  function __getAncestorBlockerDomCacheForScope() {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__ancestorBlockerDomByScope) return null;
    try {
      let perScope = __ancestorBlockerDomByScope.get(scopeObj);
      if (!(perScope instanceof WeakMap)) {
        perScope = new WeakMap();
        __ancestorBlockerDomByScope.set(scopeObj, perScope);
      }
      return perScope;
    } catch {
      return null;
    }
  }

  function __getAncestorBlockerDomStructFinalCacheForScope() {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__ancestorBlockerDomStructFinalByScope) return null;
    try {
      let perScope = __ancestorBlockerDomStructFinalByScope.get(scopeObj);
      if (!(perScope instanceof WeakMap)) {
        perScope = new WeakMap();
        __ancestorBlockerDomStructFinalByScope.set(scopeObj, perScope);
      }
      return perScope;
    } catch {
      return null;
    }
  }

  function __getDomEligibilityModeKey(opts) {
    const mode =
      opts && opts.visibilityMode === 'styleAndGeometry' ? 'styleAndGeometry' : 'styleOnly';
    const disableGeometry = !!(opts && opts.disableGeometry === true);
    return mode + '|' + (disableGeometry ? 'dg1' : 'dg0');
  }

  function __getNameOptsKey(opts) {
    // Only include options that affect this helper's output.
    const disallowContents = !!(opts && opts.disallowContents === true);
    const maxRefs = opts && opts.maxRefs != null ? Number(opts.maxRefs) | 0 : -1;
    return (disallowContents ? 'dc1' : 'dc0') + '|mr' + String(maxRefs);
  }

  function __getDescOptsKey(opts) {
    const allowTitle = !!(opts && opts.allowTitle === true);
    const maxRefs = opts && opts.maxRefs != null ? Number(opts.maxRefs) | 0 : -1;
    return (allowTitle ? 'at1' : 'at0') + '|mr' + String(maxRefs);
  }

  function getOuterHtmlSnippet(el) {
    if (!el || typeof el !== 'object') return '';
    try {
      if (__outerHtmlCache && __outerHtmlCache.has(el)) {
        __perfInc('outerHtml.hit');
        return __outerHtmlCache.get(el) || '';
      }
    } catch {}

    __perfInc('outerHtml.miss');

    let out;
    try {
      const html = el.outerHTML || '';
      if (html.length > 2000) out = html.slice(0, 2000) + '…';
      else out = html;
    } catch {
      out = '';
    }

    try {
      if (__outerHtmlCache && el && typeof el === 'object') __outerHtmlCache.set(el, out);
    } catch {}
    return out;
  }

  // --- Accessibility-tree eligibility (ordered checks) ---
  function isAccTreeEligible(node) {
    // Cache is per-scope (root/document) to avoid cross-run leakage.
    const __accCache = __getEligibilityAccCacheForScope();
    const __ancBlockCache = __getAncestorBlockerAccCacheForScope();

    if (!isElement(node)) {
      return { eligible: false, reasons: ['notElement'] };
    }

    try {
      if (__accCache && node && typeof node === 'object' && __accCache.has(node)) {
        const c = __accCache.get(node);
        if (c && typeof c === 'object') {
          return {
            eligible: !!c.eligible,
            reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : []
          };
        }
      }
    } catch {}

    const reasons = [];

    function __cacheAndReturn(res) {
      const out = {
        eligible: !!(res && res.eligible),
        reasons: res && Array.isArray(res.reasons) ? res.reasons.slice(0) : []
      };
      try {
        if (__accCache && node && typeof node === 'object') {
          __accCache.set(node, { eligible: out.eligible, reasons: out.reasons.slice(0) });
        }
      } catch {}
      return out;
    }

    const chain = ancestorsIncludingSelf(node);

    // 1) HTML/DOM hiding
    for (const a of chain) {
      if (!isElement(a)) continue;

      // Ancestor structural blockers are scope-cached (per run) to avoid repeated checks.
      let struct = null;
      try {
        if (__ancBlockCache && __ancBlockCache.has(a)) {
          __perfInc('ancestorBlockerAcc.struct.hit');
          const cached = __ancBlockCache.get(a);
          struct = cached && cached.struct ? String(cached.struct) : null;
        } else {
          __perfInc('ancestorBlockerAcc.struct.miss');
          const tn = (a.tagName || '').toLowerCase();
          if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
          else if (tn === 'template') struct = 'templateContent';
          else if (
            tn === 'script' ||
            tn === 'style' ||
            tn === 'meta' ||
            tn === 'link' ||
            tn === 'noscript'
          )
            struct = 'nonRenderedElement';
          else if (tn === 'input') {
            const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
            if (t === 'hidden') struct = 'inputHidden';
          }
          try {
            try {
              if (__ancBlockCache) {
                const prev = __ancBlockCache.has(a) ? __ancBlockCache.get(a) || null : null;
                __ancBlockCache.set(a, {
                  struct,
                  css: prev && prev.css ? prev.css : null,
                  cssKnown: prev && prev.cssKnown === true ? true : false
                });
              }
            } catch {
              __perfInc('ancestorBlockerAcc.struct.nocache');
            }
          } catch {
            __perfInc('ancestorBlockerAcc.struct.nocache');
          }
        }
      } catch {
        /* ignore */
      }

      // `hidden="until-found"` is a distinct state from a plain `hidden`
      // attribute (HTML spec: the UA stylesheet applies `content-
      // visibility: hidden` for `until-found`, vs. `display: none` for any
      // other value/bare `hidden`). content-visibility:hidden hides an
      // element's DESCENDANTS from rendering, not the element itself. The
      // `struct` lookup above is cached per-element and shared across every
      // node that walks through `a` as an ancestor, where "this ancestor
      // hides its descendants" is the right answer for `until-found`; this
      // self-only override corrects it for the case where `a` IS `node`
      // itself, without touching the cached value descendants rely on.
      // Without it, an `until-found` panel would be excluded even from
      // rules checking its own attributes.
      if (struct === 'hiddenAttr' && a === node) {
        const hiddenVal = String((a.getAttribute && a.getAttribute('hidden')) || '')
          .trim()
          .toLowerCase();
        if (hiddenVal === 'until-found') struct = null;
      }

      if (struct) return __cacheAndReturn({ eligible: false, reasons: [struct] });
    }
    if (inClosedDetailsContent(node))
      return __cacheAndReturn({ eligible: false, reasons: ['detailsClosed'] });

    // 2) Inertness / modality
    if (hasBlockingInert(node)) {
      return __cacheAndReturn({ eligible: false, reasons: ['inert'] });
    }
    // Modal dialog (best effort)
    try {
      const openModals = getOpenModalDialogs();
      if (openModals.length) {
        let inside = false;
        for (const d of openModals) {
          if (d && d.contains && d.contains(node)) {
            inside = true;
            break;
          }
        }
        if (!inside) return __cacheAndReturn({ eligible: false, reasons: ['modalInert'] });
      }
    } catch {}

    // 3) CSS rendering suppression
    // display:none is NOT inherited: if ANY ancestor (or self) has
    // display:none, the whole subtree is unrendered no matter what a
    // descendant's own display is, so this must be resolved via an
    // ancestor walk that breaks on the first blocker found.
    for (const a of chain) {
      if (!isElement(a)) continue;

      // <area> is a non-rendered element; some DOMs report display:none for it.
      // Don’t treat the *area itself* as ineligible based on computed style.
      if (a === node) {
        const tn = (a.tagName || '').toLowerCase();
        if (tn === 'area') continue;
      }

      // Cache ancestor CSS blockers (display) per scope.
      let cssBlock = null;
      let cssKnown = false;
      try {
        if (__ancBlockCache && __ancBlockCache.has(a)) {
          const cached = __ancBlockCache.get(a);
          if (cached && cached.cssKnown === true) {
            __perfInc('ancestorBlockerAcc.css.hit');
            cssKnown = true;
            cssBlock = cached.css ? String(cached.css) : null;
          } else {
            __perfInc('ancestorBlockerAcc.css.miss');
          }
        } else {
          __perfInc('ancestorBlockerAcc.css.miss');
        }
      } catch {}

      if (!cssKnown) {
        const cs = computedStyle(a);
        if (cs && cs.display === 'none') cssBlock = 'displayNone';
        // content-visibility:hidden skips the element's contents the same
        // way display:none does -- they are not rendered, not exposed to
        // the accessibility tree, not focusable and not findable in the
        // page. It does not inherit, so a descendant's own computed value
        // stays "visible" and this walk is the only way to see it; that is
        // why visibility, which does inherit, is read off the node instead
        // (below) rather than resolved here.
        else if (cs && cs.contentVisibility === 'hidden') cssBlock = 'contentVisibilityHidden';
        else cssBlock = null;

        try {
          if (__ancBlockCache) {
            const prev = __ancBlockCache.has(a) ? __ancBlockCache.get(a) || null : null;
            __ancBlockCache.set(a, {
              struct: prev && prev.struct ? prev.struct : null,
              css: cssBlock || null,
              cssKnown: true
            });
          }
        } catch {
          __perfInc('ancestorBlockerAcc.css.nocache');
        }
      }

      // The element carrying content-visibility:hidden keeps its own box:
      // it still paints, still takes focus and is still in the
      // accessibility tree -- only its subtree is skipped. The cached value
      // above answers "does this ancestor hide its descendants", which is
      // what every other node walking through `a` needs, so the self case
      // is corrected on read instead, exactly as the hidden="until-found"
      // override does in the structural walk above.
      if (cssBlock === 'contentVisibilityHidden' && a === node) cssBlock = null;

      if (cssBlock) return __cacheAndReturn({ eligible: false, reasons: [cssBlock] });
    }

    // visibility IS inherited (and thus invertible): a descendant with an
    // explicit visibility:visible re-renders even under a
    // visibility:hidden ancestor. The fully resolved, post-inheritance
    // value is already reflected in the target node's own computed
    // style, so this is checked on `node` directly rather than by
    // walking ancestors (which would incorrectly treat visibility like
    // the non-inherited `display` property above).
    {
      const tn = (node.tagName || '').toLowerCase();
      if (tn !== 'area') {
        const cs = computedStyle(node);
        if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
          return __cacheAndReturn({ eligible: false, reasons: ['visibilityHidden'] });
        }
      }
    }

    // 4) ARIA subtree hiding with exceptions with exceptions
    let ariaHidden = false;
    for (const a of chain) {
      if (!isElement(a)) continue;
      const v = a.getAttribute && a.getAttribute('aria-hidden');
      if (v != null && String(v).trim().toLowerCase() === 'true') {
        ariaHidden = true;
        break;
      }
    }
    if (ariaHidden) {
      const idref = isReferencedByVisibleIdRef(node);

      // IDREF exception stays
      if (idref)
        return __cacheAndReturn({ eligible: true, reasons: ['ariaHiddenOverriddenIdref'] });

      // Only *explicit* tabbable focus (tabindex >= 0) overrides aria-hidden by default.
      // Native focusability alone does not override aria-hidden EXCEPT for specific
      // mechanisms where the engine must still evaluate (e.g. <area> in a *used* map,
      // and <input type="image">).
      const ti = parseTabIndex(node);
      if (ti.has && ti.valid && ti.value >= 0) {
        return __cacheAndReturn({ eligible: true, reasons: ['ariaHiddenOverriddenTabbable'] });
      }

      // Programmatic focus (explicit tabindex < 0) does NOT override eligibility.
      if (ti.has && ti.valid && ti.value < 0) {
        return __cacheAndReturn({
          eligible: false,
          reasons: ['ariaHiddenProgrammaticFocusExcluded']
        });
      }

      // Exception: allow aria-hidden override for mechanisms where the engine must
      // still evaluate required labeling/alt checks. Keep this narrowly scoped.
      const tag = (node.tagName || '').toLowerCase();
      const type =
        tag === 'input'
          ? (node.getAttribute && (node.getAttribute('type') || '').toLowerCase()) || ''
          : '';

      // Native form controls are tabbable by default (even without tabindex)
      // and are targeted by labeling checks.
      const isNativeFormControl =
        tag === 'select' || tag === 'textarea' || (tag === 'input' && type !== 'hidden'); // includes type=image

      // Other elements that are natively tabbable by default (no explicit
      // tabindex required): <button>, <summary>, and <a>/<area> with a
      // non-empty href. Real browsers keep these in the tab order
      // regardless of aria-hidden; this is exactly the "aria-hidden on a
      // focusable element" anti-pattern that aria-hidden-focus.js itself
      // detects as a violation, so the eligibility model must evaluate
      // these too rather than silently excluding them. getPlatformFocusability
      // (via isPlatformFocusable) already checks the href/disabled/inert
      // conditions correctly for each of these tags.
      const isOtherNativelyFocusable = tag === 'button' || tag === 'summary' || tag === 'a';

      if (tag === 'area' || isNativeFormControl || isOtherNativelyFocusable) {
        const f2 = getPlatformFocusability(node);
        if (f2 && f2.tabbable) {
          return __cacheAndReturn({ eligible: true, reasons: ['ariaHiddenOverriddenTabbable'] });
        }
      }

      return __cacheAndReturn({ eligible: false, reasons: ['ariaHidden'] });
    }

    // 5/6 handled implicitly; 7 already covered
    return __cacheAndReturn({ eligible: true, reasons });
  }

  function isDomVisibleEligible(node, _ctx, opts) {
    const reasons = [];
    const out = (visible, reasonsArr, metrics) => ({
      eligible: !!visible,
      reasons: reasonsArr.slice(0),
      metrics: metrics && typeof metrics === 'object' ? { ...metrics } : {}
    });

    if (!isElement(node)) return out(false, ['notElement'], {});

    const __modeKey = __getDomEligibilityModeKey(opts);
    const __domCache = __getEligibilityDomCacheForScope(__modeKey);

    const __ancBlockDomCache = __getAncestorBlockerDomCacheForScope();
    const __ancBlockStructFinalCache = __getAncestorBlockerDomStructFinalCacheForScope();

    try {
      if (__domCache && node && typeof node === 'object' && __domCache.has(node)) {
        const c = __domCache.get(node);
        if (c && typeof c === 'object') {
          return {
            eligible: !!c.eligible,
            reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : [],
            metrics: c.metrics && typeof c.metrics === 'object' ? { ...c.metrics } : {}
          };
        }
      }
    } catch {}

    function __cacheAndReturn(res) {
      const outRes = {
        eligible: !!(res && res.eligible),
        reasons: res && Array.isArray(res.reasons) ? res.reasons.slice(0) : [],
        metrics: res && res.metrics && typeof res.metrics === 'object' ? { ...res.metrics } : {}
      };
      try {
        if (__domCache && node && typeof node === 'object') {
          __domCache.set(node, {
            eligible: outRes.eligible,
            reasons: outRes.reasons.slice(0),
            metrics: { ...outRes.metrics }
          });
        }
      } catch {}
      return outRes;
    }

    // 1) HTML hiding
    // Final short-circuit: reuse structural blocker result for this node when already known.
    try {
      if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(node)) {
        __perfInc('ancestorBlockerDom.structFinal.hit');
        const r = __ancBlockStructFinalCache.get(node);
        const rr = r != null && r !== '' ? String(r) : null;
        if (rr) return __cacheAndReturn(out(false, [rr], {}));
      } else {
        __perfInc('ancestorBlockerDom.structFinal.miss');
      }
    } catch {}

    const chain = ancestorsIncludingSelf(node);
    const __domStructSeen = [];
    for (const a of chain) {
      if (!isElement(a)) continue;

      __domStructSeen.push(a);

      // If an ancestor already has a final structural blocker cached,
      // short-circuit immediately (this is what the test expects).
      try {
        if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(a)) {
          __perfInc('ancestorBlockerDom.structFinal.hit');
          const r = __ancBlockStructFinalCache.get(a);
          const rr = r != null && r !== '' ? String(r) : null;
          if (rr) {
            // Propagate to nodes we've seen on this walk (including `node`)
            try {
              for (const s of __domStructSeen) {
                if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, rr);
              }
            } catch {}
            return __cacheAndReturn(out(false, [rr], {}));
          }
        }
      } catch {}

      // Cached structural blockers (per scope) to short-circuit shared ancestor checks.
      let struct = null;
      try {
        if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
          __perfInc('ancestorBlockerDom.struct.hit');
          const cached = __ancBlockDomCache.get(a);
          struct = cached && cached.struct ? String(cached.struct) : null;
        } else {
          __perfInc('ancestorBlockerDom.struct.miss');
          const tn = (a.tagName || '').toLowerCase();
          if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
          else if (tn === 'template') struct = 'templateContent';
          else if (
            tn === 'script' ||
            tn === 'style' ||
            tn === 'meta' ||
            tn === 'link' ||
            tn === 'noscript'
          )
            struct = 'nonRenderedElement';
          else if (tn === 'input') {
            const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
            if (t === 'hidden') struct = 'inputHidden';
          }
          try {
            if (__ancBlockDomCache) {
              const prev = __ancBlockDomCache.has(a) ? __ancBlockDomCache.get(a) || null : null;
              __ancBlockDomCache.set(a, {
                struct,
                css: prev && prev.css ? prev.css : null,
                cssKnown: prev && prev.cssKnown === true ? true : false,
                visibility: prev && prev.visibility ? prev.visibility : null,
                contentVisHidden: prev && prev.contentVisHidden === true ? true : null,
                opacity: prev && typeof prev.opacity === 'number' ? prev.opacity : null
              });
            }
          } catch {
            __perfInc('ancestorBlockerDom.struct.nocache');
          }
        }
      } catch {}

      if (struct) {
        try {
          if (__ancBlockStructFinalCache) {
            for (const s of __domStructSeen) {
              if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, struct);
            }
          }
        } catch {}
        return __cacheAndReturn(out(false, [struct], {}));
      }
    }

    try {
      if (__ancBlockStructFinalCache) {
        for (const s of __domStructSeen) {
          if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, null);
        }
      }
    } catch {}

    // Closed <details> hides content visually
    if (inClosedDetailsContent(node)) return __cacheAndReturn(out(false, ['detailsClosed'], {}));

    const visibilityMode =
      opts && opts.visibilityMode === 'pointer'
        ? 'pointer'
        : opts && opts.visibilityMode === 'styleAndGeometry'
          ? 'styleAndGeometry'
          : 'styleOnly';

    // CSS visibility is inherited, so the target node's own computed
    // style already reflects the fully-resolved (post-inheritance)
    // value. Checked here, before the opacity accumulation walk below,
    // so an element that is BOTH opacity:0 AND visibility:hidden (a
    // common hover/JS-reveal dropdown pattern, confirmed on a real
    // site, Getty's global nav dropdowns) is correctly reported as
    // 'visibilityHidden' rather than only 'opacityZero'. Reporting only
    // 'opacityZero' matters because callers that treat
    // opacity:0 as "still in-scope" on purpose (e.g. aria-hidden-focus, which must
    // not exclude opacity-based hiding) would otherwise see no other
    // blocking reason and wrongly conclude the element is focusable,
    // even though visibility:hidden alone already removes it from the
    // tab order in real browsers.
    {
      const nodeCs = computedStyle(node);
      if (nodeCs && (nodeCs.visibility === 'hidden' || nodeCs.visibility === 'collapse')) {
        return __cacheAndReturn(
          out(false, ['visibilityHidden'], { visibility: nodeCs.visibility })
        );
      }
    }

    // 2) CSS visibility suppression + opacity chain
    //
    // Two passes over the SAME ancestor chain, kept separate on purpose:
    // display:none (and content-visibility:hidden) are
    // absolute, un-overridable blocks. There is no CSS mechanism for a
    // descendant to un-hide itself from a display:none ancestor, unlike
    // visibility:hidden (invertible) or opacity (never a hard block by
    // this function's own design, see callers like aria-hidden-focus
    // that keep opacity:0 in-scope on purpose). A single interleaved
    // loop returning on the FIRST blocking condition would let a closer
    // ancestor's opacity:0 short-circuit before a farther ancestor's
    // display:none is reached, hiding the stronger, unconditional block
    // behind the weaker, filterable one. So pass 1 checks every ancestor
    // for a hard structural CSS block first, with no early exit for
    // opacity; pass 2 (below) computes the accumulated opacity only once no
    // hard block was found anywhere in the chain.
    const __cssInfoByAncestor = new Map();

    for (const a of chain) {
      if (!isElement(a)) continue;

      let cssBlock = null;
      let cssKnown = false;

      let cachedVisibility = null;
      let cachedContentVisHidden = null;
      let cachedOpacity = null;
      let cachedPointerEventsNone = null;
      let cachedPointerEventsKnown = false;
      let cs;

      try {
        if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
          const cached = __ancBlockDomCache.get(a);
          if (cached) {
            // cssKnown means "we already computed display/visibility/content-visibility once"
            if (cached.cssKnown === true) {
              __perfInc('ancestorBlockerDom.css.hit');
              cssKnown = true;
              cssBlock = cached.css ? String(cached.css) : null;
            } else {
              __perfInc('ancestorBlockerDom.css.miss');
            }

            cachedVisibility = cached.visibility != null ? String(cached.visibility) : null;
            cachedContentVisHidden = cached.contentVisHidden === true ? true : null;
            cachedOpacity =
              cached && typeof cached.opacity === 'number' && Number.isFinite(cached.opacity)
                ? cached.opacity
                : null;

            cachedPointerEventsNone = cached.pointerEventsNone === true ? true : null;
            cachedPointerEventsKnown = cached.pointerEventsKnown === true ? true : false;
          }
        } else {
          __perfInc('ancestorBlockerDom.css.miss');
        }
      } catch {}

      // Compute CSS blockers (and maybe opacity) only when needed
      if (!cssKnown && cachedContentVisHidden !== true) {
        cs = computedStyle(a);

        if (cs && cs.display === 'none') cssBlock = 'displayNone';
        else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
          cssBlock = 'visibilityHidden';
          cachedVisibility = cs.visibility;
        } else if (cs && cs.contentVisibility === 'hidden') {
          cssBlock = 'contentVisibilityHidden';
          cachedContentVisHidden = true;
        }

        // NEW: parse opacity once and cache it (even if cssBlock is null)
        if (cachedOpacity == null) {
          try {
            const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
            const parsed = Number.parseFloat(raw);
            if (Number.isFinite(parsed)) cachedOpacity = parsed;
          } catch {}
        }

        // Pointer reachability: pointer-events:none blocks hit-testing
        if (visibilityMode === 'pointer' && !cachedPointerEventsKnown) {
          try {
            const pe = cs && cs.pointerEvents != null ? String(cs.pointerEvents).trim() : '';
            cachedPointerEventsKnown = true;
            if (pe === 'none') cachedPointerEventsNone = true;
          } catch {}
        }

        try {
          if (__ancBlockDomCache) {
            const prev = __ancBlockDomCache.has(a) ? __ancBlockDomCache.get(a) || null : null;
            __ancBlockDomCache.set(a, {
              struct: prev && prev.struct ? prev.struct : null,
              css: cssBlock || null,
              cssKnown: true,
              visibility: cachedVisibility || (prev && prev.visibility ? prev.visibility : null),
              contentVisHidden:
                cachedContentVisHidden === true
                  ? true
                  : prev && prev.contentVisHidden === true
                    ? true
                    : null,
              opacity:
                cachedOpacity == null
                  ? prev && typeof prev.opacity === 'number'
                    ? prev.opacity
                    : null
                  : cachedOpacity,
              pointerEventsNone:
                cachedPointerEventsNone === true
                  ? true
                  : prev && prev.pointerEventsNone === true
                    ? true
                    : null,
              pointerEventsKnown:
                cachedPointerEventsKnown === true
                  ? true
                  : prev && prev.pointerEventsKnown === true
                    ? true
                    : false
            });
          }
        } catch {
          __perfInc('ancestorBlockerDom.css.nocache');
        }
      }

      __cssInfoByAncestor.set(a, {
        cssBlock,
        cachedOpacity,
        cachedPointerEventsNone,
        cachedPointerEventsKnown
      });

      if (cssBlock === 'displayNone') return __cacheAndReturn(out(false, ['displayNone'], {}));
      // NOTE: unlike display:none, CSS visibility is inherited and thus
      // invertible: a descendant with an explicit visibility:visible
      // re-renders even under a visibility:hidden ancestor. So an
      // ancestor's visibility:hidden must NOT short-circuit this walk;
      // the target node's own fully-resolved visibility is checked
      // once, after the loop (see below).
      if (cssBlock === 'contentVisibilityHidden') {
        return __cacheAndReturn(out(false, ['contentVisibilityHidden'], {}));
      }
    }

    let opacityProduct = 1;
    for (const a of chain) {
      if (!isElement(a)) continue;

      const info = __cssInfoByAncestor.get(a) || {};
      let cachedOpacity = info.cachedOpacity;
      let cachedPointerEventsNone = info.cachedPointerEventsNone;
      let cachedPointerEventsKnown = info.cachedPointerEventsKnown;
      let cs = null;

      if (visibilityMode === 'pointer') {
        // pointer-events:none prevents the element from receiving pointer interactions
        if (cachedPointerEventsKnown === true && cachedPointerEventsNone === true) {
          return __cacheAndReturn(out(false, ['pointerEventsNone'], {}));
        }

        if (cachedPointerEventsKnown !== true) {
          try {
            if (!cs) cs = computedStyle(a);
            const pe = cs && cs.pointerEvents != null ? String(cs.pointerEvents).trim() : '';
            cachedPointerEventsKnown = true;
            if (pe === 'none') cachedPointerEventsNone = true;

            // Write back pointer-events status without disturbing other fields
            try {
              if (__ancBlockDomCache) {
                const prev = __ancBlockDomCache.has(a) ? __ancBlockDomCache.get(a) || null : null;
                if (prev) {
                  __ancBlockDomCache.set(a, {
                    struct: prev.struct || null,
                    css: prev.css || null,
                    cssKnown: prev.cssKnown === true ? true : false,
                    visibility: prev.visibility || null,
                    contentVisHidden: prev.contentVisHidden === true ? true : null,
                    opacity: typeof prev.opacity === 'number' ? prev.opacity : null,
                    pointerEventsNone: cachedPointerEventsNone === true ? true : null,
                    pointerEventsKnown: cachedPointerEventsKnown === true ? true : false
                  });
                } else {
                  __ancBlockDomCache.set(a, {
                    struct: null,
                    css: null,
                    cssKnown: false,
                    visibility: null,
                    contentVisHidden: null,
                    opacity: null,
                    pointerEventsNone: cachedPointerEventsNone === true ? true : null,
                    pointerEventsKnown: cachedPointerEventsKnown === true ? true : false
                  });
                }
              }
            } catch {}
          } catch {}
        }

        if (cachedPointerEventsNone === true) {
          return __cacheAndReturn(out(false, ['pointerEventsNone'], {}));
        }
      }

      // If opacity isn't cached yet, compute once and write it back even when cssBlock was cached.
      // This prevents repeated computedStyle(a) calls across many isDomVisibleEligible() invocations.
      if (cachedOpacity == null) {
        try {
          if (!cs) cs = computedStyle(a);
          const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
          const parsed = Number.parseFloat(raw);
          if (Number.isFinite(parsed)) {
            cachedOpacity = parsed;

            // Write back to cache without disturbing other fields
            try {
              if (__ancBlockDomCache) {
                const prev = __ancBlockDomCache.has(a) ? __ancBlockDomCache.get(a) || null : null;
                if (prev) {
                  __ancBlockDomCache.set(a, {
                    struct: prev.struct || null,
                    css: prev.css || null,
                    visibility: prev.visibility || null,
                    contentVisHidden: prev.contentVisHidden === true ? true : null,
                    opacity: cachedOpacity,
                    pointerEventsNone: prev.pointerEventsNone === true ? true : null,
                    pointerEventsKnown: prev.pointerEventsKnown === true ? true : false
                  });
                } else {
                  // No prior cache entry for this ancestor and no hard
                  // structural block was found for it in pass 1 above
                  // (pass 1 would have returned early otherwise), so
                  // struct/css/visibility/contentVisHidden are all
                  // known-null here.
                  __ancBlockDomCache.set(a, {
                    struct: null,
                    css: null,
                    visibility: null,
                    contentVisHidden: null,
                    opacity: cachedOpacity,
                    pointerEventsNone: null,
                    pointerEventsKnown: false
                  });
                }
              }
            } catch {}
          }
        } catch {}
      }

      // opacity handling (visual)
      const op = cachedOpacity != null ? cachedOpacity : 1;
      opacityProduct *= op;
      // Allow callers to ignore opacity-based invisibility (still focusable).
      const ignoreOpacity = !!(opts && opts.ignoreOpacity === true);

      if (!ignoreOpacity && visibilityMode !== 'pointer' && opacityProduct <= 0.0001) {
        return __cacheAndReturn(out(false, ['opacityZero'], { opacity: opacityProduct }));
      }
    }

    // 3) Layout/geometry (optional)
    const useGeometry =
      visibilityMode === 'pointer'
        ? !(opts && opts.disableGeometry === true)
        : visibilityMode === 'styleAndGeometry' && !(opts && opts.disableGeometry === true);

    if (useGeometry) {
      try {
        if (node.getClientRects) {
          const rects = node.getClientRects();
          const rectCount = rects ? rects.length : 0;

          if (!rectCount) {
            return __cacheAndReturn(out(false, ['noClientRects'], { rectCount: 0 }));
          }

          const r = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
          const w = r && Number.isFinite(r.width) ? r.width : 0;
          const h = r && Number.isFinite(r.height) ? r.height : 0;

          if (w <= 0 || h <= 0) {
            return __cacheAndReturn(out(false, ['zeroArea'], { rectCount, width: w, height: h }));
          }

          return __cacheAndReturn(
            out(true, reasons, {
              rectCount,
              width: w,
              height: h,
              opacity: opacityProduct
            })
          );
        }
      } catch {
        // ignore geometry failures; fall back to style-only eligibility
      }
    }

    return __cacheAndReturn(out(true, reasons, { opacity: opacityProduct }));
  }

  function getEligibilityInfo(node, _ctx, opts) {
    const targetSet =
      opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
    const r =
      targetSet === 'dom' ? isDomVisibleEligible(node, _ctx, opts) : isAccTreeEligible(node);
    return {
      eligible: !!(r && r.eligible),
      reasons: r && Array.isArray(r.reasons) ? r.reasons.slice(0) : [],
      targetSet,
      accEligible: targetSet === 'acc' ? !!(r && r.eligible) : null
    };
  }

  // E) IDREF helpers
  function resolveIdRefs(idrefString, _ctx, opts) {
    const raw = trim(idrefString);
    if (!raw) return { refs: [], missing: [], flags: ['empty'] };

    // Normalize whitespace for stable cache keys
    const parts = raw.split(/\s+/).filter(Boolean);
    const normKey = parts.join(' ');

    // Root-scoped cache map
    let cacheMap = null;
    if (__idRefCacheByRoot) {
      const scopeObj = __getScopeObj();
      if (scopeObj) {
        try {
          cacheMap = __idRefCacheByRoot.get(scopeObj) || null;
          if (!cacheMap) {
            cacheMap = new Map();
            __idRefCacheByRoot.set(scopeObj, cacheMap);
          }
        } catch {
          cacheMap = null;
        }
      }
    }

    // Cached base result is *untruncated* (opts.maxRefs applied per call)
    if (cacheMap) {
      try {
        const cached = cacheMap.get(normKey);
        if (cached && cached.refs && cached.missing && cached.flags) {
          const baseRefs = Array.isArray(cached.refs) ? cached.refs.slice(0) : [];
          const baseMissing = Array.isArray(cached.missing) ? cached.missing.slice(0) : [];
          const baseFlags = Array.isArray(cached.flags) ? cached.flags.slice(0) : [];

          // Apply deterministic truncation if requested
          if (opts && opts.maxRefs && baseRefs.length > opts.maxRefs) {
            baseRefs.length = Math.max(0, Number(opts.maxRefs) | 0);
            baseFlags.push('truncated');
          }

          __perfInc('idref.resolve.hit');
          return { refs: baseRefs, missing: baseMissing, flags: baseFlags };
        }
      } catch {
        // cache read errors should never throw
      }
    }

    __perfInc(cacheMap ? 'idref.resolve.miss' : 'idref.resolve.nocache');
    // Compute base result
    const refs = [];
    const missing = [];
    const seen = new Set();

    for (const id of parts) {
      const key = trim(id);
      if (!key) continue;

      let el = safeDocGetById(key);
      if (!el) el = safeRootQueryById(key);

      if (!el || !isElement(el)) {
        missing.push(key);
        continue;
      }
      if (seen.has(el)) continue;
      seen.add(el);
      refs.push(el);
    }

    const flags = [];
    if (missing.length) flags.push('idref-missing');
    if (parts.length !== refs.length + missing.length) flags.push('deduped'); // indicates repeats

    // Store untruncated base result
    if (cacheMap) {
      try {
        cacheMap.set(normKey, {
          refs: refs.slice(0),
          missing: missing.slice(0),
          flags: flags.slice(0),
          partsLen: parts.length
        });
      } catch {
        // ignore cache write errors
      }
    }

    // Apply deterministic truncation per call
    if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
      refs.length = Math.max(0, Number(opts.maxRefs) | 0);
      flags.push('truncated');
    }

    return { refs, missing, flags };
  }

  // Native "name is derived from value/alt" mechanisms, used when resolving
  // an IDREF *target*'s own text alternative (see computeIdRefTargetTextAlternative).
  function __getElementValueLikeName(el) {
    if (!isElement(el)) return '';
    const tag = (el.tagName || '').toLowerCase();

    if (tag === 'img' || tag === 'area') {
      const alt = getAttr(el, 'alt');
      if (alt != null) {
        const t = trim(alt);
        if (t) return t;
      }
      return '';
    }

    if (tag === 'input') {
      const type = lower(getAttr(el, 'type') || 'text');
      if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') {
        const v = getAttr(el, 'value');
        if (v != null) {
          const t = trim(v);
          if (t) return t;
        }
        if (type === 'submit') return 'Submit';
        if (type === 'reset') return 'Reset';
      }
    }

    return '';
  }

  // Recursively computes an IDREF-referenced node's own text alternative,
  // per the Accessible Name and Description Computation spec (resolving a
  // reference re-applies the name-computation algorithm to the target, it
  // does not just read raw textContent. See getContentNameInfo for why
  // raw textContent misses image alt text and other attribute-sourced
  // names on descendants). `visited` guards against cycles reachable via
  // direct aria-labelledby chains (e.g. two elements labelling each
  // other); `__nameComputationDepth` additionally bounds the combined
  // depth across this function and getContentNameInfo/
  // getAccessibleNameInfo, since a hop through a target's *content* (a
  // descendant with its own aria-labelledby) starts a fresh `visited` Set
  // and would otherwise defeat that per-call guard on a genuine cycle.
  function computeIdRefTargetTextAlternative(el, visited, _ctx, opts) {
    if (!isElement(el)) return '';
    if (visited.has(el)) return '';
    visited.add(el);
    if (__nameComputationDepth >= __NAME_COMPUTATION_MAX_DEPTH) return '';

    // Establish opts.includeHidden exactly once per aria-labelledby/
    // aria-describedby traversal, from the top-level referenced target's
    // own hidden state, and never overwrite it on recursive calls, so the
    // whole referenced subtree (nested labelledby chains included) shares
    // one decision. See getContentNameInfo's collect() for what this
    // bypasses and why.
    let effOpts = opts;
    if (!opts || opts.includeHidden === undefined) {
      let hidden;
      try {
        const elig = isAccTreeEligible(el);
        hidden = !(elig && elig.eligible);
      } catch {
        hidden = false;
      }
      effOpts = Object.assign({}, opts, { includeHidden: hidden });
    }

    // Share this call's own `visited` guard with getTextFromIdRefs/
    // getTextFromIdRefsIdrefEligible (both otherwise start a fresh Set of
    // their own), so the native-<label> lookup below can't re-enter a cycle
    // undetected: a label whose content contains a descendant
    // aria-labelledby'd back to the very control it labels (e.g.
    // <label id="lbl">Custom <span aria-labelledby="x">t</span>
    // label<input id="x"></label>) resolves that descendant back into this
    // function for the SAME `el`; without the shared guard it re-walks the
    // whole label, bounded only by the blunt depth counter.
    effOpts = Object.assign({}, effOpts, { __idrefVisited: visited });

    __nameComputationDepth += 1;
    try {
      // aria-labelledby outranks aria-label per the accname spec (2A before
      // 2B), matching getAriaNameInfo's own precedence.
      const labelledBy = trim(getAttr(el, 'aria-labelledby'));
      if (labelledBy) {
        const parts = labelledBy.split(/\s+/).filter(Boolean);
        const texts = [];
        for (const id of parts) {
          let ref = safeDocGetById(id);
          if (!ref) ref = safeRootQueryById(id);
          if (ref && isElement(ref)) {
            const t = computeIdRefTargetTextAlternative(ref, visited, _ctx, effOpts);
            if (t) texts.push(t);
          }
        }
        const joined = trim(texts.join(' '));
        if (joined) return joined;
      }

      const ariaLabel = trim(getAttr(el, 'aria-label'));
      if (ariaLabel) return ariaLabel;

      // Native <label> association (getAssociatedLabelElements: a `for`-index
      // lookup plus a bounded closest('label') walk, not `.labels`/`.control`
      // -- see that function's header comment for why), same priority slot
      // (before value-like/content) as getAccessibleNameInfo's own
      // resolution of a standalone element. Without it, an aria-labelledby
      // target that is itself a labeled form control (e.g. an <input>
      // named only by a <label for>) would resolve to empty text.
      try {
        for (const labelEl of getAssociatedLabelElements(el)) {
          const info = getLabelSubtreeNameInfo(labelEl, el, _ctx, effOpts);
          if (info.present && info.value) return info.value;
        }
      } catch {}

      const valueLike = __getElementValueLikeName(el);
      if (valueLike) return valueLike;

      const contentInfo = getContentNameInfo(el, _ctx, effOpts);
      if (contentInfo && contentInfo.present && contentInfo.value) return contentInfo.value;

      const title = trim(getAttr(el, 'title'));
      if (title) return title;

      return '';
    } finally {
      __nameComputationDepth -= 1;
    }
  }

  function getTextFromIdRefs(idrefString, _ctx, opts) {
    const r = resolveIdRefs(idrefString, _ctx, opts);
    const texts = [];
    // Reuse an in-flight cycle guard when one was threaded in via
    // opts.__idrefVisited (see computeIdRefTargetTextAlternative's own
    // comment on why this matters) rather than always starting fresh --
    // a fresh Set here can't see a target already being resolved higher
    // up the SAME chain, letting a cycle slip past this function's own
    // guard undetected.
    const visited = opts && opts.__idrefVisited instanceof Set ? opts.__idrefVisited : new Set();
    for (const el of r.refs) {
      try {
        const t = computeIdRefTargetTextAlternative(el, visited, _ctx, opts);
        if (t) texts.push(t);
      } catch {}
    }
    const text = trim(texts.join(' '));
    const flags = r.flags.slice(0);
    if (!text && r.refs.length) flags.push('resolved-empty-text');
    return { text, refsCount: r.refs.length, missing: r.missing.slice(0), flags };
  }

  function isIdRefEligibleTarget(node) {
    // IDREF policy: include hidden/aria-hidden/collapsed targets,
    // exclude only inertness or non-composed.
    if (!isElement(node)) return { eligible: false, reasons: ['notElement'] };

    // NOTE: `root` is not an eligibility boundary for IDREF targets.

    if (hasBlockingInert(node)) return { eligible: false, reasons: ['inert'] };

    return { eligible: true, reasons: [] };
  }

  function getTextFromIdRefsIdrefEligible(idrefString, _ctx, opts) {
    const r = resolveIdRefs(idrefString, _ctx, opts);

    const texts = [];
    const excluded = []; // [{ id, reasons }]
    // Same shared-cycle-guard reuse as getTextFromIdRefs above.
    const visited = opts && opts.__idrefVisited instanceof Set ? opts.__idrefVisited : new Set();
    for (const el of r.refs) {
      const elig = isIdRefEligibleTarget(el);
      if (!elig.eligible) {
        const id = trim(el.getAttribute && el.getAttribute('id'));
        excluded.push({ id: id || null, reasons: elig.reasons.slice(0) });
        continue;
      }
      try {
        const t = computeIdRefTargetTextAlternative(el, visited, _ctx, opts);
        if (t) texts.push(t);
      } catch {}
    }

    const text = trim(texts.join(' '));
    const flags = r.flags.slice(0);
    if (!text && r.refs.length) flags.push('resolved-empty-text');

    if (excluded.length) flags.push('idref-excluded');

    return {
      text,
      refsCount: r.refs.length,
      missing: r.missing.slice(0),
      excluded,
      flags
    };
  }

  // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
  // Computes a wrapping/explicit <label>'s own text for the purpose of
  // naming ONE specific control inside it, excluding that control's own
  // subtree (matches HTML-AAM's "label text minus embedded control
  // content"). On purpose, it does NOT call back into
  // getAccessibleNameInfo/getContentNameInfo for descendants: only img
  // alt (getTextAlternativeInfo), aria-label (getAriaLabelInfo), and
  // aria-labelledby (getAriaLabelledByInfo) on descendants, all of which
  // are leaf-safe with respect to <label> lookups. This matters because
  // getAccessibleNameInfo calls this function, and getContentNameInfo's
  // own descendant walk calls getAccessibleNameInfo. If this function
  // routed back through either of those instead, a control nested inside
  // its own naming <label> (the exact case this exists to handle) would
  // recurse forever between "what's my name" and "what's my label's
  // content."
  function getLabelSubtreeNameInfo(labelEl, excludeEl, _ctx, opts) {
    if (!isElement(labelEl)) return { present: false, value: '', mechanism: 'none', flags: [] };

    const parts = [];
    let guardCount = 0;

    function isImageLikeNode(node) {
      const tag = lower(node.tagName);
      const type = tag === 'input' ? lower(getAttr(node, 'type')) : '';
      return tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image');
    }

    function walk(node) {
      if (node === excludeEl) return; // exclude the target control's own subtree
      guardCount += 1;
      if (guardCount > 5000) return;

      if (node.nodeType === 3) {
        const t = trim(node.nodeValue);
        if (t) parts.push(t);
        return;
      }
      if (!isElement(node)) return;

      let eligible;
      try {
        const r = isAccTreeEligible(node);
        eligible = !!(r && r.eligible);
      } catch {
        eligible = true;
      }
      if (!eligible) return;

      const al = getAriaLabelInfo(node);
      if (al && al.present && al.value) {
        parts.push(al.value);
        return;
      }
      const alb = getAriaLabelledByInfo(node, _ctx, opts);
      if (alb && alb.present && alb.value) {
        parts.push(alb.value);
        return;
      }

      if (isImageLikeNode(node)) {
        const alt = getTextAlternativeInfo(node, _ctx, opts);
        if (alt && alt.present && alt.value) parts.push(alt.value);
        return;
      }

      const kids = node.childNodes ? Array.from(node.childNodes) : [];
      for (const kid of kids) walk(kid);
    }

    try {
      const kids = labelEl.childNodes ? Array.from(labelEl.childNodes) : [];
      for (const kid of kids) walk(kid);
    } catch {}

    const value = trim(parts.join(' ').replace(/\s+/g, ' '));
    return { present: !!value, value, mechanism: 'label', flags: value ? [] : ['empty'] };
  }

  // ACT scopes every accessible-name rule to elements "included in the
  // accessibility tree" (c487ae link-name, 97a4e1 button-name and siblings),
  // and its glossary puts focusable aria-hidden content outside that set:
  // "Because they are hidden, these elements are considered not included in
  // the accessibility tree", even where a browser leaves them in it. The
  // defect they do represent, aria-hidden over content in the focus order,
  // belongs to aria-hidden-focus (ACT 6cfa84, WCAG 4.1.2).
  //
  // isAccTreeEligible keeps them eligible on purpose so aria-hidden-focus can
  // reach them, so naming rules need this narrower question instead.
  function isIncludedInAccessibilityTree(el) {
    const r = isAccTreeEligible(el);
    if (!r || !r.eligible) return false;
    const reasons = Array.isArray(r.reasons) ? r.reasons : [];
    return !reasons.some((x) => typeof x === 'string' && x.indexOf('ariaHiddenOverridden') === 0);
  }

  function getAccessibleNameInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const key = __getNameOptsKey(opts);
    try {
      if (__accessibleNameCacheByKey && __accessibleNameCacheByKey.has(key)) {
        const wm = __accessibleNameCacheByKey.get(key);
        if (wm && wm instanceof WeakMap && wm.has(el)) {
          const c = wm.get(el);
          if (c && typeof c === 'object') {
            __perfInc('accessibleName.hit');
            return {
              present: !!c.present,
              value: c.value == null ? '' : String(c.value),
              mechanism: c.mechanism || 'none',
              flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
            };
          }
        }
      }
    } catch {}
    __perfInc('accessibleName.miss');

    const aria = getAriaNameInfo(el, _ctx, opts);
    if (aria && aria.present && aria.value) {
      const out = {
        present: true,
        value: aria.value,
        mechanism: aria.mechanism,
        flags: flags.concat(aria.flags || [])
      };
      try {
        if (__accessibleNameCacheByKey && __nameComputationDepth === 0) {
          const wm =
            __accessibleNameCacheByKey.get(key) ||
            (__accessibleNameCacheByKey.set(key, new WeakMap()),
            __accessibleNameCacheByKey.get(key));
          if (wm && wm instanceof WeakMap)
            wm.set(el, {
              present: !!out.present,
              value: out.value,
              mechanism: out.mechanism,
              flags: out.flags.slice(0)
            });
        }
      } catch {}
      return out;
    }
    if (aria && aria.flags && aria.flags.length) {
      for (const f of aria.flags) flags.push(f);
    }

    // Native <label> association: `<label for="...">` and a wrapping
    // `<label>...</label>` both resolve through getAssociatedLabelElements
    // (a `for`-index lookup plus a bounded closest('label') walk, not the
    // native `.labels`/`.control` pair -- see that function's header
    // comment for why), for any element with a matching id or that sits
    // inside a wrapping label, labelable or not. Catches e.g. an unlabeled
    // icon-only <button> wrapped in a <label>, and a non-natively-labelable
    // element like <div role="button" id="x"> named by <label for="x">,
    // in the same pass.
    try {
      // Seed the IDREF cycle guard with `el` itself before walking its own
      // label: a label whose content contains a descendant
      // aria-labelledby'd back to `el` (the very control being named --
      // self-contradictory, but not invalid markup) would otherwise
      // resolve that descendant via a brand-new getTextFromIdRefs Set that
      // has no idea `el`'s own name is already mid-computation,
      // round-tripping back through this exact label once before the
      // (correctly guarded) inner resolution stops it -- doubling every
      // part of the label's text. See computeIdRefTargetTextAlternative's
      // own __idrefVisited comment for the general mechanism this reuses.
      const labelOpts = Object.assign({}, opts, { __idrefVisited: new Set([el]) });
      for (const labelEl of getAssociatedLabelElements(el)) {
        const info = getLabelSubtreeNameInfo(labelEl, el, _ctx, labelOpts);
        if (info.present && info.value) {
          const out = { present: true, value: info.value, mechanism: 'label', flags };
          try {
            if (__accessibleNameCacheByKey && __nameComputationDepth === 0) {
              const wm =
                __accessibleNameCacheByKey.get(key) ||
                (__accessibleNameCacheByKey.set(key, new WeakMap()),
                __accessibleNameCacheByKey.get(key));
              if (wm && wm instanceof WeakMap)
                wm.set(el, {
                  present: true,
                  value: out.value,
                  mechanism: out.mechanism,
                  flags: out.flags.slice(0)
                });
            }
          } catch {}
          return out;
        }
        // If this label exists but is empty, keep trying any other
        // associated label rather than stopping (matches prior behavior:
        // an empty label alone doesn't produce a name).
      }
    } catch {}

    // The alt attribute is accname's own next naming source for img/area/
    // input[type=image] -- ranked above title, below ARIA naming and real
    // <label> association -- so this general-purpose function needs the
    // same source getTextAlternativeInfo already applies specifically to
    // these tags (kept as a direct attribute read here, not a call into
    // getTextAlternativeInfo, since that function itself calls back into
    // this one when alt is absent).
    const tagForAlt = lower(el.tagName);
    const typeForAlt = tagForAlt === 'input' ? lower(getAttr(el, 'type')) : '';
    const isImageLikeForAlt =
      tagForAlt === 'img' ||
      tagForAlt === 'area' ||
      (tagForAlt === 'input' && typeForAlt === 'image');
    if (isImageLikeForAlt) {
      const altText = trim(getAttr(el, 'alt'));
      if (altText) {
        const out = { present: true, value: altText, mechanism: 'alt', flags };
        try {
          if (__accessibleNameCacheByKey && __nameComputationDepth === 0) {
            const wm =
              __accessibleNameCacheByKey.get(key) ||
              (__accessibleNameCacheByKey.set(key, new WeakMap()),
              __accessibleNameCacheByKey.get(key));
            if (wm && wm instanceof WeakMap)
              wm.set(el, {
                present: true,
                value: out.value,
                mechanism: out.mechanism,
                flags: out.flags.slice(0)
              });
          }
        } catch {}
        return out;
      }
    }

    // POLICY NOTE (revisit if ever reconsidered): title is accepted here as
    // a last-resort accessible-name source, matching HTML-AAM/accname. This
    // is a spec-compliant choice, but title is a weak
    // mechanism in practice (no touch/mobile exposure, inconsistent
    // screen-reader support, no visible affordance for sighted users), and
    // this is the shared function nearly every accessible-name-dependent
    // rule in the engine goes through. Flagged here so it isn't silently
    // load-bearing.
    const title = trim(getAttr(el, 'title'));
    if (title) {
      flags.push('title-used');
      const out = { present: true, value: title, mechanism: 'title', flags };
      try {
        if (__accessibleNameCacheByKey && __nameComputationDepth === 0) {
          const wm =
            __accessibleNameCacheByKey.get(key) ||
            (__accessibleNameCacheByKey.set(key, new WeakMap()),
            __accessibleNameCacheByKey.get(key));
          if (wm && wm instanceof WeakMap)
            wm.set(el, {
              present: true,
              value: out.value,
              mechanism: out.mechanism,
              flags: out.flags.slice(0)
            });
        }
      } catch {}
      return out;
    }

    const out = { present: false, value: '', mechanism: 'none', flags };
    try {
      if (__accessibleNameCacheByKey && __nameComputationDepth === 0) {
        const wm =
          __accessibleNameCacheByKey.get(key) ||
          (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
        if (wm && wm instanceof WeakMap)
          wm.set(el, {
            present: false,
            value: '',
            mechanism: 'none',
            flags: out.flags.slice(0)
          });
      }
    } catch {}
    return out;
  }

  function getAccessibleDescriptionInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    const key = __getDescOptsKey(opts);
    try {
      if (__accessibleDescCacheByKey && __accessibleDescCacheByKey.has(key)) {
        const wm = __accessibleDescCacheByKey.get(key);
        if (wm && wm instanceof WeakMap && wm.has(el)) {
          const c = wm.get(el);
          if (c && typeof c === 'object') {
            __perfInc('accessibleDesc.hit');
            return {
              present: !!c.present,
              value: c.value == null ? '' : String(c.value),
              mechanism: c.mechanism || 'none',
              flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
            };
          }
        }
      }
    } catch {}
    __perfInc('accessibleDesc.miss');

    const describedBy = trim(getAttr(el, 'aria-describedby'));
    if (describedBy) {
      const t = getTextFromIdRefs(describedBy, _ctx, opts);
      for (const f of t.flags) flags.push(f);
      if (t.text) {
        const out = { present: true, value: t.text, mechanism: 'aria-describedby', flags };
        try {
          if (__accessibleDescCacheByKey) {
            const wm =
              __accessibleDescCacheByKey.get(key) ||
              (__accessibleDescCacheByKey.set(key, new WeakMap()),
              __accessibleDescCacheByKey.get(key));
            if (wm && wm instanceof WeakMap)
              wm.set(el, {
                present: true,
                value: out.value,
                mechanism: out.mechanism,
                flags: out.flags.slice(0)
              });
          }
        } catch {}
        return out;
      }
      flags.push('empty');
    }

    const allowTitle = !!(opts && opts.allowTitle === true);
    if (allowTitle) {
      const title = trim(getAttr(el, 'title'));
      if (title) {
        flags.push('title-used');
        const out = { present: true, value: title, mechanism: 'title', flags };
        try {
          if (__accessibleDescCacheByKey) {
            const wm =
              __accessibleDescCacheByKey.get(key) ||
              (__accessibleDescCacheByKey.set(key, new WeakMap()),
              __accessibleDescCacheByKey.get(key));
            if (wm && wm instanceof WeakMap)
              wm.set(el, {
                present: true,
                value: out.value,
                mechanism: out.mechanism,
                flags: out.flags.slice(0)
              });
          }
        } catch {}
        return out;
      }
    }

    const out = { present: false, value: '', mechanism: 'none', flags };
    try {
      if (__accessibleDescCacheByKey) {
        const wm =
          __accessibleDescCacheByKey.get(key) ||
          (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
        if (wm && wm instanceof WeakMap)
          wm.set(el, {
            present: false,
            value: '',
            mechanism: 'none',
            flags: out.flags.slice(0)
          });
      }
    } catch {}
    return out;
  }

  // <canvas> fallback content is the element's *children*, not just its
  // rendered text. A documented HTML5 technique is an equivalent <img
  // alt="..."> (or similarly self-describing element) inside <canvas>.
  // textContent alone misses that, since alt text isn't part of it.
  function __hasMeaningfulCanvasFallbackDescendant(container) {
    try {
      if (!container || !container.querySelectorAll) return false;

      const imgs = container.querySelectorAll('img[alt]');
      for (const img of imgs) {
        if (trim(img.getAttribute && img.getAttribute('alt'))) return true;
      }

      const areas = container.querySelectorAll('area[alt]');
      for (const area of areas) {
        if (trim(area.getAttribute && area.getAttribute('alt'))) return true;
      }

      const named = container.querySelectorAll('[aria-label]');
      for (const n of named) {
        if (trim(n.getAttribute && n.getAttribute('aria-label'))) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // C) Text alternative helper (mechanism-aware by element/type)
  function getTextAlternativeInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el)) {
      return {
        present: false,
        value: '',
        mechanism: 'unsupported',
        requiredMechanism: 'unknown',
        flags: ['notElement']
      };
    }

    const tag = lower(el.tagName);
    const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';

    const isImageLike = tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image');

    if (isImageLike) {
      const altRaw = getAttr(el, 'alt');
      const altPresent = altRaw != null;
      const altText = trim(altRaw);

      if (altPresent) {
        if (!altText) flags.push('alt-empty');
        return {
          present: true,
          value: altText,
          mechanism: 'alt',
          requiredMechanism: 'alt',
          flags
        };
      }

      // Missing alt is a real issue even if an accessible name exists.
      const name = getAccessibleNameInfo(el, _ctx, opts);
      if (name && name.present && name.value) flags.push('name-present-but-alt-missing');
      flags.push('alt-missing');

      return {
        present: false,
        value: name && name.present ? name.value || '' : '',
        mechanism: name && name.present ? 'accessible-name' : 'none',
        requiredMechanism: 'alt',
        flags: flags.concat(name && name.flags ? name.flags.slice(0) : [])
      };
    }

    if (tag === 'canvas') {
      const fallbackText = trim(el.textContent || '');
      if (fallbackText || __hasMeaningfulCanvasFallbackDescendant(el)) {
        return {
          present: true,
          value: fallbackText || 'fallback-content',
          mechanism: 'canvas-fallback',
          requiredMechanism: 'fallback-or-name',
          flags
        };
      }

      // <canvas> is not a labelable element (no browser computes an
      // accessible name from <label for="...">), so only ARIA naming
      // (and title, as a generic last-resort accname source) count,
      // unlike getAccessibleNameInfo, which also accepts native
      // <label> associations.
      const aria = getAriaNameInfo(el, _ctx, opts);
      if (aria && aria.present && aria.value) {
        return {
          present: true,
          value: aria.value,
          mechanism: aria.mechanism || 'aria',
          requiredMechanism: 'fallback-or-name',
          flags: flags.concat(aria.flags ? aria.flags.slice(0) : [])
        };
      }

      const title = trim(getAttr(el, 'title'));
      if (title) {
        return {
          present: true,
          value: title,
          mechanism: 'title',
          requiredMechanism: 'fallback-or-name',
          flags: flags.concat(['title-used'])
        };
      }

      return {
        present: false,
        value: '',
        mechanism: 'none',
        requiredMechanism: 'fallback-or-name',
        flags: flags.concat(aria && aria.flags ? aria.flags.slice(0) : [])
      };
    }

    return {
      present: false,
      value: '',
      mechanism: 'unsupported',
      requiredMechanism: 'unknown',
      flags: ['unsupported-element']
    };
  }

  // C.1) "Name from content": recursive accname-aligned content-name computation.
  //
  // Rationale: the accname spec's "name from content" step (2F) is recursive:
  // for each child node, use that CHILD's own accessible name if it has one
  // (aria-label/aria-labelledby/native <label>/title, or `alt` for image-like
  // elements) rather than only concatenating literal text nodes. A naive
  // TreeWalker(SHOW_TEXT)-only walk misses any descendant that gets its
  // name from an attribute rather than visible text, e.g. a logo link
  // `<a href="..."><img alt="Company Name"></a>` or an icon-only button
  // `<button><span role="img" aria-label="Close"></span></button>`.
  function getContentNameInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el))
      return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

    // Shares __nameComputationDepth with computeIdRefTargetTextAlternative;
    // see that function's header comment for why a single per-call
    // guard isn't enough on its own.
    if (__nameComputationDepth >= __NAME_COMPUTATION_MAX_DEPTH) {
      return { present: false, value: '', mechanism: 'none', flags: ['depth-limit'] };
    }

    const maxNodes =
      opts && Number.isFinite(opts.maxContentNodes) ? Math.max(1, opts.maxContentNodes) : 5000;
    let visitedCount = 0;
    let truncated = false;

    // WAI-ARIA's Global States and Properties set -- used below to decide
    // whether a role="presentation"/"none" image-like descendant has been
    // restored to a real node by conflict resolution (same list as
    // aria-required-parent.js/aria-prohibited-children.js's GLOBAL_ARIA_ATTRS).
    const GLOBAL_ARIA_ATTRS_FOR_CONTENT_NAME = [
      'aria-atomic',
      'aria-braillelabel',
      'aria-brailleroledescription',
      'aria-busy',
      'aria-controls',
      'aria-current',
      'aria-describedby',
      'aria-description',
      'aria-details',
      'aria-disabled',
      'aria-dropeffect',
      'aria-errormessage',
      'aria-flowto',
      'aria-grabbed',
      'aria-haspopup',
      'aria-hidden',
      'aria-invalid',
      'aria-keyshortcuts',
      'aria-label',
      'aria-labelledby',
      'aria-live',
      'aria-owns',
      'aria-relevant',
      'aria-roledescription'
    ];

    function isImageLikeNode(node) {
      const tag = lower(node.tagName);
      const type = tag === 'input' ? lower(getAttr(node, 'type')) : '';
      return tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image');
    }

    function collect(node, parts) {
      if (truncated) return;
      visitedCount += 1;
      if (visitedCount > maxNodes) {
        truncated = true;
        if (flags.indexOf('truncated') === -1) flags.push('truncated');
        return;
      }

      if (node.nodeType === 3) {
        const t = trim(node.nodeValue);
        if (t) parts.push(t);
        return;
      }

      if (!isElement(node)) return;

      // Skip anything not exposed to the accessibility tree (hidden,
      // aria-hidden, display:none, inert, etc.), same scope as
      // isAccTreeEligible, so a hidden descendant never contributes.
      //
      // Exception: opts.includeHidden (set by computeIdRefTargetTextAlternative
      // when the aria-labelledby/aria-describedby TARGET itself is hidden)
      // skips this check entirely except for tags that never render at all.
      // Per the accname spec, a directly-referenced target's own hidden
      // state doesn't block name computation, and that bypass covers the
      // target's whole subtree, not just the target element. Without it,
      // several elements labelled by distinct-but-hidden targets would all
      // resolve to unnamed and collapse into one false "not unique" cluster
      // (landmark-unique, dialog/tab/menuitem-name-present, etc.).
      if (opts && opts.includeHidden) {
        const tag = lower(node.tagName);
        if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') return;
      } else {
        let eligible;
        try {
          const eligRes = isAccTreeEligible(node);
          eligible = !!(eligRes && eligRes.eligible);
        } catch {
          eligible = true;
        }
        if (!eligible) return;
      }

      if (isImageLikeNode(node)) {
        // A role="presentation"/"none" image contributes nothing -- per
        // ACT ffd0e9's own clarification, alt does not trigger
        // Presentational Roles Conflict Resolution (it is not an ARIA
        // attribute), so a plain conflict-resolution carve-out (global
        // ARIA attribute present, or focusable) is what would restore it,
        // same condition aria-required-parent.js's getRealContextRole
        // and aria-prohibited-children.js already use for the analogous
        // "roleless-but-included" boundary.
        const presRole = lower(getAttr(node, 'role') || '').split(/\s+/)[0];
        if (presRole === 'presentation' || presRole === 'none') {
          let restored = false;
          try {
            restored = !!(getFocusableInfo(node, _ctx, opts) || {}).focusable;
          } catch {}
          if (!restored) {
            for (const attr of GLOBAL_ARIA_ATTRS_FOR_CONTENT_NAME) {
              if (getAttr(node, attr) != null) {
                restored = true;
                break;
              }
            }
          }
          if (!restored) return;
        }

        // aria-labelledby/aria-label take priority over alt per the
        // accname spec (HTML-AAM), so they're checked first: an
        // <img alt="" aria-labelledby="..."> must contribute the
        // referenced text, not nothing, to its parent's content name.
        //
        // Uses getAriaNameInfo (aria only) on purpose, NOT the general
        // getAccessibleNameInfo, since the latter falls back to a native
        // <label>/title, which for an image-like descendant must rank
        // BELOW alt, not above it (otherwise an image's title tooltip would
        // win over its real alt text).
        const ariaName = getAriaNameInfo(node, _ctx, opts);
        if (ariaName && ariaName.present && ariaName.value) {
          parts.push(ariaName.value);
          if (flags.indexOf('descendant-name-used:image-aria') === -1)
            flags.push('descendant-name-used:image-aria');
          return;
        }

        // input[type=image] (unlike img/area) is a real, plain
        // labelable form control -- a native <label> association
        // still outranks its alt attribute per accname's
        // element-specific name mapping, so it's checked here,
        // ahead of alt/title, same relative order getAccessibleNameInfo
        // itself uses for every other labelable control.
        if (lower(node.tagName) === 'input') {
          try {
            if (node.labels && node.labels.length) {
              for (const labelEl of Array.from(node.labels)) {
                const labelInfo = getLabelSubtreeNameInfo(labelEl, node, _ctx, opts);
                if (labelInfo.present && labelInfo.value) {
                  parts.push(labelInfo.value);
                  if (flags.indexOf('descendant-name-used:image-label') === -1)
                    flags.push('descendant-name-used:image-label');
                  return;
                }
              }
            }
          } catch {}
        }

        // alt (even an explicit alt="", a deliberate "decorative,
        // contributes nothing" marker) always outranks title.
        // getTextAlternativeInfo already encodes exactly that
        // precedence: `present` distinguishes a real (possibly
        // empty) alt attribute -- terminal, contributes its
        // (possibly empty) value and nothing else -- from one
        // that's structurally absent, where `value` already
        // carries getTextAlternativeInfo's own title fallback.
        const alt = getTextAlternativeInfo(node, _ctx, opts);
        if (alt && alt.value) {
          const usedFlag = alt.present
            ? 'descendant-alt-used'
            : 'descendant-name-used:image-title-fallback';
          parts.push(alt.value);
          if (flags.indexOf(usedFlag) === -1) flags.push(usedFlag);
        }
        return; // image-like elements have no meaningful children to recurse into
      }

      const ownName = getAccessibleNameInfo(node, _ctx, opts);
      // A descendant's own name outranks its content for real naming
      // mechanisms (aria-label/aria-labelledby, a native <label>), but not for
      // a bare title: accname orders name-from-content ahead of the title
      // fallback, so a descendant's title may only speak for it when its
      // content is empty. Same precedence the image-like branch above applies
      // to alt; without it, a tooltip silently replaces the visible text of
      // anything named from its content.
      const titleOnlyName = !!(
        ownName &&
        ownName.present &&
        ownName.value &&
        ownName.mechanism === 'title'
      );

      if (ownName && ownName.present && ownName.value && !titleOnlyName) {
        parts.push(ownName.value);
        const tag = `descendant-name-used:${ownName.mechanism || 'unknown'}`;
        if (flags.indexOf(tag) === -1) flags.push(tag);
        return; // this descendant speaks for itself; don't also use its content
      }

      if (titleOnlyName) {
        // Content first; keep the title only if the content contributed
        // nothing. Compared on the trimmed join rather than parts.length,
        // since a whitespace-only text node pushes a part but no name text.
        const before = parts.length;
        walkChildren(node, parts);
        if (!trim(parts.slice(before).join(' '))) {
          parts.length = before;
          parts.push(ownName.value);
          if (flags.indexOf('descendant-name-used:title-fallback') === -1)
            flags.push('descendant-name-used:title-fallback');
        } else if (flags.indexOf('descendant-title-superseded-by-content') === -1) {
          flags.push('descendant-title-superseded-by-content');
        }
        return;
      }

      walkChildren(node, parts);
    }

    // Extracted from collect() so the title-only branch above can walk a
    // descendant's children and then decide whether the title was needed,
    // without duplicating the <slot> handling.
    function walkChildren(node, parts) {
      // A <slot>'s own childNodes are its FALLBACK content only,
      // rendered solely when nothing is assigned to it. When real content
      // IS distributed into it, that's what's exposed to the accessibility
      // tree, and it lives elsewhere in the light DOM, not as this node's
      // children, so prefer assignedNodes() and fall back to childNodes.
      if (lower(node.tagName) === 'slot' && typeof node.assignedNodes === 'function') {
        let assigned;
        try {
          assigned = node.assignedNodes({ flatten: true }) || [];
        } catch {
          assigned = [];
        }
        const kids = assigned.length
          ? assigned
          : node.childNodes
            ? Array.from(node.childNodes)
            : [];
        for (const kid of kids) {
          collect(kid, parts);
          if (truncated) break;
        }
        return;
      }

      const kids = node.childNodes ? Array.from(node.childNodes) : [];
      for (const kid of kids) {
        collect(kid, parts);
        if (truncated) break;
      }
    }

    const parts = [];
    __nameComputationDepth += 1;
    try {
      const topKids = el.childNodes ? Array.from(el.childNodes) : [];
      for (const kid of topKids) {
        collect(kid, parts);
        if (truncated) break;
      }
    } finally {
      __nameComputationDepth -= 1;
    }

    const value = trim(parts.join(' ').replace(/\s+/g, ' '));
    return {
      present: !!value,
      value,
      mechanism: value ? 'content' : 'none',
      flags
    };
  }

  // D) Role + focusability helpers
  function getRoleInfo(el, _ctx, opts) {
    const flags = [];
    if (!isElement(el)) return { role: '', source: 'none', flags: ['notElement'] };

    const explicit = trim(getAttr(el, 'role'));
    if (explicit) {
      const v = explicit;
      const low = v.toLowerCase();
      if (low === 'presentation' || low === 'none') flags.push('presentation');
      // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
      if (/\s/.test(v)) flags.push('multiple-roles');
      return { role: v, source: 'explicit', flags };
    }

    const allowImplicit = !(opts && opts.disallowImplicit === true);
    if (!allowImplicit) return { role: '', source: 'none', flags };

    const tag = lower(el.tagName);
    const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';
    const href = tag === 'a' || tag === 'area' ? trim(getAttr(el, 'href')) : '';

    // Minimal implicit mapping (expand later if needed, but keep stable and small).
    let role = '';
    if ((tag === 'a' || tag === 'area') && href) role = 'link';
    else if (tag === 'button') role = 'button';
    else if (tag === 'summary') role = 'button';
    else if (tag === 'input') {
      if (type === 'checkbox') role = 'checkbox';
      else if (type === 'radio') role = 'radio';
      else if (type === 'range') role = 'slider';
      else if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image')
        role = 'button';
      else if (type !== 'hidden') role = 'textbox';
    } else if (tag === 'select') role = 'combobox';
    else if (tag === 'textarea') role = 'textbox';

    if (role) return { role, source: 'implicit', flags };
    return { role: '', source: 'none', flags };
  }

  function getFocusableInfo(el, _ctx, opts) {
    // Allocation-minimal merge: avoid chained concat() which creates intermediate arrays.
    if (!isElement(el))
      return { focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement'] };

    const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags

    // Merge flags deterministically (stable order: local flags, then pf.flags)
    const outFlags = [];
    // (No local flags today; keep structure for forward compatibility without extra allocations.)
    if (pf && Array.isArray(pf.flags) && pf.flags.length) {
      for (let i = 0; i < pf.flags.length; i++) outFlags.push(pf.flags[i]);
    }

    return {
      focusable: !!(pf && pf.focusable),
      tabbable: !!(pf && pf.tabbable),
      mechanism: (pf && pf.mechanism) || 'none',
      flags: outFlags
    };
  }

  function getVisibilityHintsInfo(el, _ctx, opts) {
    // Deterministic, style-only visibility hints for triage.
    // Does NOT decide eligibility; checks decide outcomes.
    // Uses computedStyle() which is already scope-cached.

    if (!isElement(el)) return { hints: [], metrics: {}, flags: ['notElement'] };

    // Cache per element per run
    try {
      if (__visibilityHintsCache && __visibilityHintsCache.has(el)) {
        __perfInc('visibilityHints.hit');
        const c = __visibilityHintsCache.get(el);
        if (c && typeof c === 'object') {
          return {
            hints: Array.isArray(c.hints) ? c.hints.slice(0) : [],
            metrics: c.metrics && typeof c.metrics === 'object' ? { ...c.metrics } : {},
            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
          };
        }
      }
    } catch {
      // ignore
    }

    __perfInc('visibilityHints.miss');

    const hints = [];
    const metrics = {};
    const flags = [];

    const cs = computedStyle(el) || {};

    // opacity:0
    try {
      const raw = cs.opacity != null ? String(cs.opacity).trim() : '';
      const op = raw ? Number.parseFloat(raw) : 1;
      if (Number.isFinite(op)) metrics.opacity = op;
      if (Number.isFinite(op) && op <= 0.0001) hints.push('opacityZero');
    } catch {
      flags.push('opacity-parse-failed');
    }

    // clip / clip-path
    try {
      const clip = cs.clip != null ? String(cs.clip).trim() : '';
      const clipPath = cs.clipPath != null ? String(cs.clipPath).trim() : '';

      const clipLow = clip.toLowerCase();
      const clipPathLow = clipPath.toLowerCase();

      if (clipLow && clipLow !== 'auto') {
        // Detect common visually-hidden: rect(0,0,0,0)
        const norm = clipLow.replace(/\s+/g, '');
        if (norm.indexOf('rect(') !== -1 && norm.indexOf('rect(0') !== -1) hints.push('clipped');
      }

      if (clipPathLow && clipPathLow !== 'none') {
        // Detect common visually-hidden: inset(50%) / inset(100%)
        if (
          clipPathLow.indexOf('inset(') !== -1 &&
          (clipPathLow.indexOf('50%') !== -1 || clipPathLow.indexOf('100%') !== -1)
        ) {
          hints.push('clipped');
        }
      }

      if (clip) metrics.clip = clip;
      if (clipPath) metrics.clipPath = clipPath;
    } catch {
      flags.push('clip-parse-failed');
    }

    // zero-size + overflow hidden/clip
    try {
      const wv = cs.width != null ? String(cs.width).trim() : '';
      const hv = cs.height != null ? String(cs.height).trim() : '';
      const ov = cs.overflow != null ? String(cs.overflow).trim().toLowerCase() : '';

      metrics.width = wv || null;
      metrics.height = hv || null;
      metrics.overflow = ov || null;

      const isZeroW = wv === '0px' || wv === '0';
      const isZeroH = hv === '0px' || hv === '0';
      const hidesOverflow = ov === 'hidden' || ov === 'clip';
      if ((isZeroW || isZeroH) && hidesOverflow) hints.push('zeroSizeOverflowHidden');
    } catch {
      flags.push('size-parse-failed');
    }

    // offscreen heuristic (string-based; no geometry)
    try {
      const pos = cs.position != null ? String(cs.position).trim().toLowerCase() : '';
      const left = cs.left != null ? String(cs.left).trim().toLowerCase() : '';
      const top = cs.top != null ? String(cs.top).trim().toLowerCase() : '';
      const ti = cs.textIndent != null ? String(cs.textIndent).trim().toLowerCase() : '';

      metrics.position = pos || null;
      metrics.left = left || null;
      metrics.top = top || null;
      metrics.textIndent = ti || null;

      // em/rem convert to an approximate px value (root font-size 16px,
      // the common default) so a value like "-999em" is correctly judged
      // against the px threshold below instead of being compared as a
      // bare number -999, which never crosses it regardless of unit.
      const parsePx = (s) => {
        if (!s || s === 'auto') return null;
        const m = String(s).match(/-?\d+(\.\d+)?(em|rem|px)?/);
        if (!m) return null;
        const n = Number.parseFloat(m[0]);
        if (!Number.isFinite(n)) return null;
        const unit = m[2];
        return unit === 'em' || unit === 'rem' ? n * 16 : n;
      };

      const l = parsePx(left);
      const t = parsePx(top);
      const ind = parsePx(ti);

      if (pos === 'absolute' || pos === 'fixed') {
        if ((l != null && l <= -5000) || (t != null && t <= -5000)) hints.push('offscreen');
      }
      if (ind != null && ind <= -5000) hints.push('offscreen');
    } catch {
      flags.push('offscreen-parse-failed');
    }

    // Dedupe hints, stable order
    const order = ['opacityZero', 'offscreen', 'clipped', 'zeroSizeOverflowHidden'];
    const seen = new Set();
    const stable = [];
    for (const k of order) {
      if (hints.indexOf(k) !== -1 && !seen.has(k)) {
        seen.add(k);
        stable.push(k);
      }
    }

    const out = { hints: stable, metrics, flags };

    try {
      if (__visibilityHintsCache) {
        __visibilityHintsCache.set(el, {
          hints: stable.slice(0),
          metrics: { ...metrics },
          flags: flags.slice(0)
        });
      }
    } catch {
      __perfInc('visibilityHints.nocache');
    }

    return out;
  }

  // Back-compat: keep existing helper but implement via new name helper.
  function hasAccessibleName(el) {
    const info = getAccessibleNameInfo(el);
    return !!(info && info.present && trim(info.value));
  }

  function createSelectorUniqIndex() {
    const idCount = new Map();
    const testIdCount = new Map(); // data-testid + data-test + data-cy + data-qa
    const nameCount = new Map(); // key: tag|name
    const ariaLabelCount = new Map(); // key: tag|aria-label
    const roleAriaLabelCount = new Map(); // key: role|aria-label

    const sel = '[id],[data-testid],[data-test],[data-cy],[data-qa],[name],[aria-label],[role]';
    let nodes;
    if (typeof queryAllSmart === 'function') {
      nodes = queryAllSmart(sel) || [];
    } else {
      // Defensive fallback (queryAllSmart is always defined in this
      // module, so this branch is not expected to run) -- loop every
      // resolved root rather than assuming a single scope element.
      nodes = [];
      const seen = new Set();
      for (const r of roots) {
        if (!r || !r.querySelectorAll) continue;
        for (const el of r.querySelectorAll(sel)) {
          if (el && !seen.has(el)) {
            seen.add(el);
            nodes.push(el);
          }
        }
      }
      if (!nodes.length && !roots.length && document) {
        nodes = Array.from(document.querySelectorAll(sel));
      }
    }

    const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

    for (const el of nodes) {
      if (!el || el.nodeType !== 1) continue;

      const tag = (el.tagName || '').toLowerCase();

      const elementId = el.getAttribute('id');
      if (elementId && elementId.trim()) inc(idCount, elementId.trim());

      for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
        const v = el.getAttribute(a);
        if (v && v.trim()) inc(testIdCount, a + '=' + v.trim());
      }

      const name = el.getAttribute('name');
      if (name && name.trim() && tag) inc(nameCount, tag + '|' + name.trim());

      const aria = el.getAttribute('aria-label');
      if (aria && aria.trim() && tag) inc(ariaLabelCount, tag + '|' + aria.trim());

      const role = el.getAttribute('role');
      if (role && role.trim() && aria && aria.trim()) {
        inc(roleAriaLabelCount, role.trim() + '|' + aria.trim());
      }
    }

    return { idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount };
  }

  function buildSimpleSelector(el, fallbackTag) {
    try {
      if (!el || el.nodeType !== 1) return fallbackTag || 'html';

      const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

      const cssEscapeIdent = __cssEscapeIdent;

      const escapeAttrValue = __escapeAttrValue;

      // Same trimmed-check / raw-value-embed split as buildSelectorUncached's
      // anchor builders (see that function's header comment): a CSS
      // attribute/ID selector must match the DOM attribute's real,
      // untrimmed value exactly, so only the truthiness check may trim.
      const elementId = el.getAttribute && el.getAttribute('id');
      if (elementId && elementId.trim()) return '#' + cssEscapeIdent(elementId);

      for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
        const v = el.getAttribute && el.getAttribute(a);
        if (v && v.trim()) return '[' + a + '="' + escapeAttrValue(v) + '"]';
      }

      const name = el.getAttribute && el.getAttribute('name');
      if (name && name.trim()) return tag + '[name="' + escapeAttrValue(name) + '"]';

      return tag;
    } catch {
      return fallbackTag || 'html';
    }
  }

  function getUniqIndex() {
    const scopeObj = __getScopeObj();
    if (!scopeObj || !__uniqIndexByScope) {
      __perfInc('uniqIndex.nocache');
      // Fallback: build per call (should be rare; determinism preserved)
      return createSelectorUniqIndex();
    }

    // Partitioned by __selectorOptsKey: the index's counts depend on
    // includeShadowDom/excludeSelectors (via queryAllSmart), so a scope
    // reused across runs with different options must not share indices.
    let perScope;
    try {
      perScope = __uniqIndexByScope.get(scopeObj);
      if (!(perScope instanceof Map)) {
        perScope = new Map();
        __uniqIndexByScope.set(scopeObj, perScope);
      }
    } catch {
      __perfInc('uniqIndex.nocache');
      return createSelectorUniqIndex();
    }

    const key = __getSelectorOptsKey();
    const cached = perScope.get(key);
    if (cached) {
      __perfInc('uniqIndex.hit');
      return cached;
    }

    __perfInc('uniqIndex.miss');
    const idx = createSelectorUniqIndex();
    try {
      perScope.set(key, idx);
    } catch {
      /* ignore */
    }
    __perfInc('uniqIndex.build');
    return idx;
  }

  function buildSelectorUncached(el) {
    const escapeAttrValue = __escapeAttrValue;
    try {
      if (!el || el.nodeType !== 1) return 'html';

      const cssEscape = __cssEscapeIdent;

      const idx = getUniqIndex();
      const tag = (el.tagName || '').toLowerCase();

      // NOTE: every anchor builder below keys its uniqueness-index lookup on
      // the *trimmed* attribute value (matching how the index itself was
      // built in createSelectorUniqIndex, so whitespace-only differences
      // don't spuriously count as "different" values) but embeds the *raw,
      // untrimmed* attribute value in the actual CSS selector string. A CSS
      // attribute selector (`[attr="..."]`) requires an exact match against
      // the real DOM attribute -- trimming the embedded value while the
      // real attribute keeps its whitespace produces a selector that can
      // never match -- e.g. on Slack's real homepage, several
      // `role="region"` promo cards have a templated `aria-label` ending
      // in a trailing ", " (a
      // string-concatenation artifact, not a typo), which made every one of
      // these anchor builders silently construct a non-matching selector,
      // falling through to the document-wide non-unique `buildSimpleSelector`
      // tag-only fallback (e.g. plain "header") for elements that actually
      // had a perfectly good, unique aria-label anchor available -- and any
      // downstream consumer re-resolving that bare-tag selector via
      // `querySelector` (this comparisons project's own tooling included)
      // silently gets the *wrong* element instead of an error.
      const uniqueIdSel = () => {
        const elementId = el.getAttribute('id');
        if (!elementId || !elementId.trim()) return null;
        if (idx && (idx.idCount.get(elementId.trim()) || 0) === 1)
          return '#' + cssEscape(elementId);
        return null;
      };

      const uniqueTestSel = () => {
        for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
          const v = el.getAttribute(a);
          if (!v || !v.trim()) continue;
          const key = a + '=' + v.trim();
          if (idx && (idx.testIdCount.get(key) || 0) === 1) {
            return '[' + a + '="' + escapeAttrValue(v) + '"]';
          }
        }
        return null;
      };

      const uniqueNameSel = () => {
        const v = el.getAttribute('name');
        if (!v || !v.trim() || !tag) return null;
        const key = tag + '|' + v.trim();
        if (idx && (idx.nameCount.get(key) || 0) === 1)
          return tag + '[name="' + escapeAttrValue(v) + '"]';
        return null;
      };

      const uniqueAriaSel = () => {
        const v = el.getAttribute('aria-label');
        if (!v || !v.trim() || !tag) return null;
        const key = tag + '|' + v.trim();
        if (idx && (idx.ariaLabelCount.get(key) || 0) === 1)
          return tag + '[aria-label="' + escapeAttrValue(v) + '"]';
        return null;
      };

      const uniqueRoleAriaSel = () => {
        const role = el.getAttribute('role');
        const aria = el.getAttribute('aria-label');
        if (!role || !role.trim() || !aria || !aria.trim()) return null;
        const key = role.trim() + '|' + aria.trim();
        if (idx && (idx.roleAriaLabelCount.get(key) || 0) === 1) {
          return (
            '[role="' + escapeAttrValue(role) + '"][aria-label="' + escapeAttrValue(aria) + '"]'
          );
        }
        return null;
      };

      const direct =
        uniqueIdSel() ||
        uniqueTestSel() ||
        uniqueRoleAriaSel() ||
        uniqueNameSel() ||
        uniqueAriaSel();

      if (direct) return direct;

      const parts = [];

      function nthOfType(node) {
        const t = (node.tagName || '').toLowerCase() || '*';
        const p = node.parentElement;
        if (!p) return t;

        let i = 1;
        let sib = node.previousElementSibling;
        while (sib) {
          if ((sib.tagName || '').toLowerCase() === t) i++;
          sib = sib.previousElementSibling;
        }

        // A same-tag sibling before this node (i > 1) already means
        // an unqualified tag selector would be ambiguous, so there's no need
        // to also scan forward in that case. Only scan
        // nextElementSibling when this node is the first of its tag
        // among its siblings, to catch the case where the
        // disambiguating sibling comes after it instead.
        let hasSame = i > 1;
        if (!hasSame) {
          sib = node.nextElementSibling;
          while (sib) {
            if ((sib.tagName || '').toLowerCase() === t) {
              hasSame = true;
              break;
            }
            sib = sib.nextElementSibling;
          }
        }
        return hasSame ? t + ':nth-of-type(' + i + ')' : t;
      }

      let node = el;
      let safety = 0;

      // Only apply the "stop climbing once we reach a contextSelector-
      // matched root" shortcut when there's a single (or no) matched
      // root -- resolveContextRoots() falls back to `[documentElement]`
      // when no contextSelector is given, so this is the overwhelmingly
      // common case and behaves exactly as before.
      //
      // With MULTIPLE matched roots (multi-region contextSelector
      // scans), stopping there without recording anything about which
      // root produced an ambiguous, non-unique selector string for two
      // structurally-identical regions is a real bug -- e.g. two
      // wrapper <div>s, each containing two identical ".widget"
      // sections scanned via `contextSelector: '.widget'`, produced the
      // *same* selector string ("section:nth-of-type(1) > div > div >
      // button") for the equivalent button in each wrapper --
      // resolving to 2 elements instead of 1 when queried, and pointing
      // at the wrong one for at least one of the two occurrences. The
      // existing `el.matches(candidate)` safety check below couldn't
      // catch this: it only verifies THIS element matches the string,
      // never that the string is unique document-wide.
      //
      // So when multiple roots are in play, don't stop early --
      // keep climbing (same as the always-correct no-contextSelector
      // path) until finding an anchor that's actually unique or reaching the
      // true document root, which is always singular. That preserves
      // the invariant the final safety-check comment below relies on,
      // rather than needing a separate (more expensive) document-wide
      // uniqueness re-check.
      const stopAtMatchedRoot = roots.length <= 1;

      while (node && node.nodeType === 1 && safety++ < 20) {
        let anchor = null;

        if (node !== el) {
          const t = (node.tagName || '').toLowerCase();
          // Same trimmed-key-lookup / raw-value-embed split as the direct
          // anchor builders above -- see this function's header comment.
          const id = node.getAttribute('id');
          if (id && id.trim() && idx && (idx.idCount.get(id.trim()) || 0) === 1)
            anchor = '#' + cssEscape(id);
          if (!anchor) {
            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
              const v = node.getAttribute(a);
              if (v && v.trim() && idx && (idx.testIdCount.get(a + '=' + v.trim()) || 0) === 1) {
                anchor = '[' + a + '="' + escapeAttrValue(v) + '"]';
                break;
              }
            }
          }
          if (!anchor) {
            const name = node.getAttribute('name');
            if (
              name &&
              name.trim() &&
              t &&
              idx &&
              (idx.nameCount.get(t + '|' + name.trim()) || 0) === 1
            ) {
              anchor = t + '[name="' + escapeAttrValue(name) + '"]';
            }
          }
          if (!anchor) {
            const aria = node.getAttribute('aria-label');
            if (
              aria &&
              aria.trim() &&
              t &&
              idx &&
              (idx.ariaLabelCount.get(t + '|' + aria.trim()) || 0) === 1
            ) {
              anchor = t + '[aria-label="' + escapeAttrValue(aria) + '"]';
            }
          }
        }

        if (node === el) {
          parts.unshift(nthOfType(node));
        } else if (anchor) {
          parts.unshift(anchor);
          break;
        } else {
          parts.unshift(nthOfType(node));
        }

        if (!node.parentElement || (stopAtMatchedRoot && roots.includes(node))) break;
        node = node.parentElement;
      }

      const candidate = parts.join(' > ') || tag || 'html';

      // Verify the constructed selector string actually resolves to
      // `el` per the CSS engine's own semantics. This is a real safety net,
      // since some selector engines (observed in jsdom) disagree with
      // this function's own :nth-of-type sibling counting in edge
      // cases. `el.matches(candidate)` checks exactly that (does the
      // engine agree this element satisfies the string we built) at a
      // cost bounded by el's own ancestor-chain depth.
      //
      // This intentionally does NOT re-verify global uniqueness via a
      // whole-document query: every path segment above pins an exact
      // position relative to its own parent via `>` (child, not
      // descendant) combinators, so a correctly-matching chain can
      // only resolve to one element short of a malformed document
      // (e.g. two <html> roots) -- true as long as the walk above
      // never stops short of an anchor/root that's actually unique, which is
      // exactly what `stopAtMatchedRoot` guarantees (see its own
      // comment above; without it, a multi-root contextSelector scan
      // stopping early would violate this invariant silently). Re-deriving
      // that guarantee via a
      // document-wide :nth-of-type scan was measured to cost O(total
      // same-tag siblings) per call, which is pathological on pages with many
      // flat, unidentified siblings (e.g. hundreds of unlabeled
      // <img>s), while contributing no realistic additional safety.
      try {
        if (el && typeof el.matches === 'function' && el.matches(candidate)) return candidate;
      } catch {}

      return buildSimpleSelector(el, tag || 'html');
    } catch {
      return 'html';
    }
  }

  function buildSelector(el) {
    const cache = __getSelectorCacheForOpts();
    try {
      if (cache && el && typeof el === 'object' && cache.has(el)) {
        __perfInc('selector.hit');
        return cache.get(el) || 'html';
      }
    } catch {}
    __perfInc('selector.miss');
    const sel = buildSelectorUncached(el);
    try {
      if (cache && el && typeof el === 'object') cache.set(el, sel);
    } catch {}
    return sel;
  }

  // Sibling-index path from documentElement's descendants down to `el`
  // ([] if `el` IS the documentElement); null if `el` is falsy or detached
  // in a way that makes indexing impossible. A more robust element-identity
  // mechanism than a CSS selector string alone (survives some DOM changes
  // a selector wouldn't -- e.g. an id/class rename), at the cost of not
  // being usable as a real CSS selector itself. Deliberately mirrors the
  // same algorithm used by this project's (external) cross-engine
  // result-matching tooling exactly, rather than requiring it --
  // this file must stay self-contained (embedded into the generated
  // runtime via .toString(), no module requires survive that), so a
  // correctness fix to the algorithm must be applied to both copies.
  function structuralPath(el) {
    if (!el || typeof el !== 'object') return null;
    const path = [];
    let node = el;
    try {
      while (node && node.parentElement) {
        const parent = node.parentElement;
        const idx = Array.prototype.indexOf.call(parent.children, node);
        if (idx < 0) return null;
        path.unshift(idx);
        node = parent;
      }
    } catch {
      return null;
    }
    return path;
  }

  // Occurrence-level structural path: prefers the actual element reference
  // (exact, no re-resolution risk) and only falls back to re-resolving via
  // the occurrence's own selector when no element reference was kept --
  // the same technique the cross-engine live-DOM adapters already use to
  // recover an element from a reported selector, with the same accepted
  // caveat (a non-unique selector could resolve to a different element
  // than originally intended -- already documented as "structural-path
  // collisions" for the cross-engine tooling).
  function buildStructuralPath(node, selector) {
    if (node && typeof node === 'object') {
      const p = structuralPath(node);
      if (p) return p;
    }
    if (
      selector &&
      typeof selector === 'string' &&
      document &&
      typeof document.querySelector === 'function'
    ) {
      // A rule that reports its element never lands here. Counted so the
      // cost of re-finding one shows up in perfStats, not just as a slow scan.
      __perfInc('structuralPath.selectorFallback');

      let el;
      try {
        el = document.querySelector(selector);
      } catch {
        el = null;
      }
      if (el) return structuralPath(el);
    }
    return null;
  }

  function getNonEmptyTitle(el) {
    if (!getAttributeInfo) return null;
    try {
      const info = getAttributeInfo(el, 'title');
      const v = info && info.present ? trim(info.value) : '';
      return v ? v : null;
    } catch {
      return null;
    }
  }

  function isPlaceholderCapable(el) {
    // Per HTML, `placeholder` is only a name/hint source for text-entry
    // input types and <textarea>. Browsers/AT ignore it on other input
    // types (checkbox, radio, range, color, date, file, ...) and on
    // <select>, so it must not be treated as an accessible-name source
    // for those.
    try {
      if (!isElement(el)) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'textarea') return true;
      if (tag !== 'input') return false;
      const type = ((el.getAttribute && (el.getAttribute('type') || 'text')) || 'text')
        .toLowerCase()
        .trim();
      const t = type || 'text';
      return (
        t === 'text' ||
        t === 'search' ||
        t === 'tel' ||
        t === 'url' ||
        t === 'email' ||
        t === 'password' ||
        t === 'number'
      );
    } catch {
      return false;
    }
  }

  function getNonEmptyPlaceholder(el) {
    if (!getAttributeInfo) return null;
    if (!isPlaceholderCapable(el)) return null;
    try {
      const info = getAttributeInfo(el, 'placeholder');
      const v = info && info.present ? trim(info.value) : '';
      return v ? v : null;
    } catch {
      return null;
    }
  }

  // A <label> contributes a name to its associated control either via its
  // own aria-label/aria-labelledby (checked first, the usual ARIA-over-
  // content precedence, so <label aria-label="Toggle Navigation"> names
  // its control even when its only child content is aria-hidden), or,
  // failing that, its rendered content (getContentNameInfo, which excludes
  // aria-hidden/display:none/inert descendants, so a label whose only
  // text is aria-hidden gives the control no name despite the association).
  function labelContributesAccessibleName(lab) {
    try {
      const aria = getAriaNameInfo(lab, null, {});
      if (aria && aria.present && trim(aria.value)) return true;
    } catch {}
    try {
      const info = getContentNameInfo(lab, null, {});
      if (info && info.present && trim(info.value)) return true;
    } catch {
      return true; // conservative on error: don't newly fail
    }
    // A <label> with no aria-name and empty own content can still
    // contribute a name via its own title attribute -- accname's title-
    // fallback step applies to any element, the label itself included, so
    // `<label for="..." title="Search"></label>` with empty content is an
    // intentional PASS. Without this, form-control-programmatic-label-present
    // would wrongly fail it.
    try {
      return !!getNonEmptyTitle(lab);
    } catch {
      return false;
    }
  }

  function hasLabelAssociation(el) {
    // Deterministic, stable subset:
    // - <label for="id">
    // - wrapping <label> ... <input> ...
    // A structural association alone isn't enough; see
    // labelContributesAccessibleName above for what counts.
    if (!isElement(el)) return false;

    try {
      if (
        __labelAssociationCache &&
        el &&
        typeof el === 'object' &&
        __labelAssociationCache.has(el)
      ) {
        __perfInc('labelAssociation.hit');
        return !!__labelAssociationCache.get(el);
      }
    } catch {}

    __perfInc('labelAssociation.miss');
    // getAssociatedLabelElements resolves both wrapping <label> and
    // <label for="id"> association as real elements, without the native
    // `.labels`/`.control` pair -- see that function's header comment for
    // why (jsdom implements `.labels` as an expensive whole-document walk;
    // this doesn't).
    const associatedLabels = getAssociatedLabelElements(el);
    const out = associatedLabels.length
      ? associatedLabels.some(labelContributesAccessibleName)
      : false;

    try {
      if (__labelAssociationCache && el && typeof el === 'object')
        __labelAssociationCache.set(el, !!out);
    } catch {}

    return out;
  }

  function getLabelMethod(el, _ctx, opts) {
    // returns { method, value } where value is best-effort text, deterministically trimmed
    if (!isElement(el)) return { method: 'none', value: null };

    try {
      if (__labelMethodCache && el && typeof el === 'object' && __labelMethodCache.has(el)) {
        __perfInc('labelMethod.hit');
        const c = __labelMethodCache.get(el);
        if (c && typeof c === 'object') {
          return { method: c.method || 'none', value: c.value == null ? null : String(c.value) };
        }
      }
    } catch {}

    __perfInc('labelMethod.miss');
    let out = { method: 'none', value: null };

    if (hasLabelAssociation(el)) out = { method: 'label', value: null };
    else if (getAriaLabelledByInfo) {
      try {
        const info = getAriaLabelledByInfo(el, _ctx, { maxRefs: 8 });
        const v = info && info.present ? trim(info.value) : '';
        if (v) out = { method: 'aria-labelledby', value: v };
      } catch {}
    }

    if (out.method === 'none' && getAriaLabelInfo) {
      try {
        const info = getAriaLabelInfo(el);
        const v = info && info.present ? trim(info.value) : '';
        if (v) out = { method: 'aria-label', value: v };
      } catch {}
    }

    if (out.method === 'none') {
      const titleV = getNonEmptyTitle(el);
      if (titleV) out = { method: 'title', value: titleV };
    }

    if (out.method === 'none') {
      const phV = getNonEmptyPlaceholder(el);
      if (phV) out = { method: 'placeholder', value: phV };
    }

    try {
      if (__labelMethodCache && el && typeof el === 'object') {
        __labelMethodCache.set(el, { method: out.method, value: out.value });
      }
    } catch {}

    return out;
  }

  function getLabelStrength(method) {
    // policy choice; this is deterministic and tweakable
    if (method === 'label' || method === 'aria-labelledby') return 'strong';
    if (method === 'aria-label') return 'medium';
    if (method === 'title' || method === 'placeholder') return 'weak';
    return 'none';
  }

  function reportOccurrence(node, partial) {
    const o =
      partial && typeof partial === 'object' && !Array.isArray(partial) ? { ...partial } : {};
    // Attach the node for engine-side finalization. This must be removed later before returning results.
    o.__node = node || null;
    return o;
  }

  // Resolves the final {outcome, severity, occurrences} for a rule that
  // collects two independent confidence tiers during one run: some
  // findings are confident enough for a hard `fail`, others only warrant
  // `cantTell` (e.g. "this needs human review"). The naive approach
  // (`if (failOccurrences.length) return fail(failOccurrences); else if
  // (cantTellOccurrences.length) return cantTell(cantTellOccurrences);`)
  // silently drops every cantTell-tier finding whenever at least one
  // fail-tier finding also exists on the same page. That's a real information
  // loss for a real scan, not just a test artifact: a page with one
  // confident violation and five "needs review" ones would report only
  // the one. This is a recurring shape across automatic rules with a
  // fail/cantTell split (e.g. aria-prohibited-attr's roleless-naming
  // branch, aria-hidden-focus's runtime-redirect downgrade), which is why
  // it's factored into this one shared helper rather than reimplemented
  // per rule.
  // The correct behavior when a fail-tier finding exists: the overall
  // outcome is still `fail` (a real, confident violation must still gate
  // CI), but BOTH buckets' occurrences are returned together, not just
  // the fail ones. Each occurrence already carries its own
  // distinguishing `data.details.reasonCode`/summary/hint, so nothing
  // about which findings were confident vs. which need review is lost;
  // only the single aggregate outcome label stays singular, which is
  // already this engine's accepted one-outcome-per-rule-run schema
  // constraint (changing that is a separate, much larger, cross-cutting
  // decision spanning report.js/baseline.js/explain.js/WCAG rollups,
  // out of scope for this helper).
  function resolveTieredOutcome(failOccurrences, cantTellOccurrences, severity) {
    function withOccurrenceTier(items, tier) {
      return items.map((occ) => {
        if (!occ || typeof occ !== 'object' || Array.isArray(occ)) return occ;
        if (occ.occurrenceOutcome === 'fail' || occ.occurrenceOutcome === 'cantTell') return occ;
        return { ...occ, occurrenceOutcome: tier };
      });
    }

    const fails = Array.isArray(failOccurrences) ? failOccurrences : [];
    const cantTells = Array.isArray(cantTellOccurrences) ? cantTellOccurrences : [];
    const failTier = withOccurrenceTier(fails, 'fail');
    const cantTellTier = withOccurrenceTier(cantTells, 'cantTell');
    if (fails.length) {
      return { outcome: 'fail', severity, occurrences: failTier.concat(cantTellTier) };
    }
    if (cantTells.length) {
      return { outcome: 'cantTell', severity, occurrences: cantTellTier };
    }
    return { outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  let __contrastSharedCache = {};
  try {
    // In Node/JSDOM checks, the harness sets global.window/global.document.
    // The engine may instantiate helpers per rule without passing opts.window,
    // so we must be able to recover the stable realm window to share caches.
    const w =
      realmWindow ||
      (document && document.defaultView) ||
      (typeof global !== 'undefined' && global.window ? global.window : null);

    if (w) {
      if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
      if (!w.__a11ycoreSharedCache.contrast) w.__a11ycoreSharedCache.contrast = {};
      __contrastSharedCache = w.__a11ycoreSharedCache.contrast;
    }
  } catch {
    __contrastSharedCache = {};
  }

  const __contrastShared = {
    trim,
    computedStyle,
    composedParent,
    buildSimpleSelector,
    __contrastSharedCache
  };

  const contrast = createContrastHelpers(
    { window: realmWindow || window, document, root: roots, includeShadowDom, excludeSelectors },
    __contrastShared
  );

  // Expose shared cache to checks (deterministic, in-memory only)
  contrast.sharedCache = __contrastShared.__contrastSharedCache;

  const aria = createAriaHelpers(
    { window: realmWindow || window, document, root: roots },
    { trim }
  );

  // For rules whose check is inherently about the WHOLE page (does the
  // page have a title? a declared language? a way to skip repeated
  // blocks?) rather than about elements found within a scanned subtree --
  // these can't be answered correctly by scoping via queryAllSmart/ctx.root
  // the way per-element checks can, since a subtree that never had (and
  // was never meant to have) e.g. its own <title> shouldn't be faulted for
  // lacking one. `false` when `fragment:true` was explicitly set, or when
  // `contextSelector` scoped this run narrower than the whole document
  // (roots doesn't include document.documentElement); `true` in the
  // default/unscoped case, so this is a no-op for the overwhelming
  // majority of existing (whole-page) scans.
  function isWholeDocumentScope() {
    if (fragment) return false;
    return roots.includes(document.documentElement);
  }

  return {
    isValidLanguageTag,
    isRegisteredLanguageSubtag,

    // Existing query/snippet utilities
    queryAll,
    queryAllDeep,
    queryAllSmart,
    getOuterHtmlSnippet,
    buildSimpleSelector,
    buildSelector,
    buildStructuralPath,

    // Existing (back-compat)
    hasAccessibleName,
    isExcluded,
    isAccTreeEligible,
    isIncludedInAccessibilityTree,
    isDomVisibleEligible,
    isWholeDocumentScope,

    // Engine-internal: sets which rule's rule-scoped excludeSelectors
    // (engineOptions.rules[ruleId].excludeSelectors) are currently in
    // effect. Called by dom-runner.js before each rule invocation, not
    // intended for use by rule implementations.
    __setActiveRuleExcludeSelectors,

    // Eligibility info wrapper
    getEligibilityInfo,

    // IDREF primitives
    resolveIdRefs,
    getTextFromIdRefs,
    getTextFromIdRefsIdrefEligible,

    // ARIA-only name primitives (new)
    getAriaLabelInfo,
    getAriaLabelledByInfo,
    getAriaNameInfo,

    // Landmark-role naming (aria-label -> aria-labelledby -> title; no content fallback --
    // see getLandmarkNameInfo's own header comment for why this replaced 7 duplicated copies)
    getLandmarkNameInfo,

    // "Does this element have a landmark-scoping ancestor" (role-aware
    // sectioning-content/<main> check backing <header>/<footer>/<aside>'s
    // conditional implicit roles) -- re-exported from aria helpers at
    // this top level, matching getLandmarkNameInfo just above, so the
    // manual landmark-check files that used to each carry their own
    // (buggy, tag-only) copy can call helpers.hasLandmarkScopingAncestor
    // directly. See aria.hasLandmarkScopingAncestor's own header comment
    // in src/core/aria-helpers.js for the full algorithm and rationale.
    hasLandmarkScopingAncestor: aria.hasLandmarkScopingAncestor,

    // Name / description
    getAccessibleNameInfo,
    getAccessibleDescriptionInfo,

    // Text alternatives
    getTextAlternativeInfo,

    // Recursive "name from content" (accname-aligned; see getContentNameInfo header comment)
    getContentNameInfo,

    // Role / focusability
    getRoleInfo,
    getFocusableInfo,
    getVisibilityHintsInfo,

    getAttributeInfo,

    getLabelMethod,
    getLabelStrength,

    // Real <label> elements associated with a control (a `<label for="id">`
    // pointing at it, plus a wrapping `<label>` it's the first labelable
    // descendant of), for a rule that needs the actual elements rather than
    // just a method/strength classification. See this function's own
    // definition above for the full algorithm and why it doesn't use the
    // native `.labels`/`.control` pair.
    getAssociatedLabelElements,

    // Whether a <label> carries text that names its associated control
    // (own aria-name, else rendered content, else title). Shared so
    // form-control-single-label and form-control-programmatic-label-present
    // agree on what a label is worth.
    labelContributesAccessibleName,

    // Flat-tree ancestor walk (assignedSlot-aware, then shadow host).
    // See this function's own definition above for why assignedSlot
    // must win over parentNode.
    composedParent,
    hasTruncatedAncestorWalk,

    // Perf counters (only populated when opts.perfStats === true)
    getPerfStats,
    resetPerfStats,

    reportOccurrence,
    resolveTieredOutcome,

    contrast,
    aria
  };
}

module.exports = {
  normalizeSelectorList,
  resolveContextRoots,
  createDomHelpers
};
