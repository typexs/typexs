import {Entity, Property} from '@typexs/schema';


@Entity({name: 'bew'})
export class Candidate {

  @Property({type: 'number', name: 'bewnr', id: true})
  bewnr: number;
  @Property({type: 'string', name: 'efh', length: 4, nullable: true })
  efh: string;
  @Property({type: 'date', name: 'eingangdat', nullable: true })
  eingangdat: Date;
  @Property({type: 'string', name: 'fehlerkz', length: 1, nullable: true })
  fehlerkz: string;
  @Property({type: 'number', name: 'mtknr', nullable: true })
  mtknr: number;
  @Property({type: 'number', name: 'prfzif', nullable: true })
  prfzif: number;
  @Property({type: 'number', name: 'bewsem', nullable: true })
  bewsem: number;
  @Property({type: 'string', name: 'anti', length: 25, nullable: true })
  anti: string;
  @Property({type: 'string', name: 'nachname', length: 35, nullable: true })
  nachname: string;
  @Property({type: 'string', name: 'sortname', length: 20, nullable: true })
  sortname: string;
  @Property({type: 'string', name: 'vorname', length: 30, nullable: true })
  vorname: string;
  @Property({type: 'string', name: 'gebname', length: 35, nullable: true })
  gebname: string;
  @Property({type: 'string', name: 'gebort', length: 25, nullable: true })
  gebort: string;
  @Property({type: 'date', name: 'gebdat', nullable: true })
  gebdat: Date;
  @Property({type: 'string', name: 'geschl', length: 1, nullable: true })
  geschl: string;
  @Property({type: 'string', name: 'staat', length: 3, nullable: true })
  staat: string;
  @Property({type: 'string', name: 'pozusatz', length: 255, nullable: true })
  pozusatz: string;
  @Property({type: 'string', name: 'postrasse', length: 30, nullable: true })
  postrasse: string;
  @Property({type: 'string', name: 'poplz', length: 10, nullable: true })
  poplz: string;
  @Property({type: 'string', name: 'poort', length: 30, nullable: true })
  poort: string;
  @Property({type: 'string', name: 'pozustbez', length: 2, nullable: true })
  pozustbez: string;
  @Property({type: 'string', name: 'pokfz', length: 3, nullable: true })
  pokfz: string;
  @Property({type: 'string', name: 'potel', length: 50, nullable: true })
  potel: string;
  @Property({type: 'number', name: 'bishsem', nullable: true })
  bishsem: number;
  @Property({type: 'string', name: 'zweitst', length: 1, nullable: true })
  zweitst: string;
  @Property({type: 'string', name: 'hmkfzkz', length: 1, nullable: true })
  hmkfzkz: string;
  @Property({type: 'string', name: 'hmkfz', length: 4, nullable: true })
  hmkfz: string;
  @Property({type: 'number', name: 'antrnr', nullable: true })
  antrnr: number;
  @Property({type: 'double', name: 'gebn', nullable: true })
  gebn: number;
  @Property({type: 'string', name: 'fehlunt', length: 1, nullable: true })
  fehlunt: string;
  @Property({type: 'string', name: 'f1', length: 2, nullable: true })
  f1: string;
  @Property({type: 'string', name: 'f2', length: 2, nullable: true })
  f2: string;
  @Property({type: 'string', name: 'f3', length: 2, nullable: true })
  f3: string;
  @Property({type: 'string', name: 'f4', length: 2, nullable: true })
  f4: string;
  @Property({type: 'string', name: 'f5', length: 2, nullable: true })
  f5: string;
  @Property({type: 'string', name: 'f6', length: 2, nullable: true })
  f6: string;
  @Property({type: 'string', name: 'f7', length: 2, nullable: true })
  f7: string;
  @Property({type: 'string', name: 'f8', length: 2, nullable: true })
  f8: string;
  @Property({type: 'string', name: 'bem', length: 35, nullable: true })
  bem: string;
  @Property({type: 'string', name: 'verwkz1', length: 2, nullable: true })
  verwkz1: string;
  @Property({type: 'string', name: 'verwkz2', length: 2, nullable: true })
  verwkz2: string;
  @Property({type: 'string', name: 'verwkz3', length: 2, nullable: true })
  verwkz3: string;
  @Property({type: 'string', name: 'verwkz4', length: 2, nullable: true })
  verwkz4: string;
  @Property({type: 'string', name: 'verarbkz', length: 2, nullable: true })
  verarbkz: string;
  @Property({type: 'string', name: 'bemlang', length: 255, nullable: true })
  bemlang: string;
  @Property({type: 'string', name: 'staatkez', length: 1, nullable: true })
  staatkez: string;
  @Property({type: 'string', name: 'anschrkz', length: 1, nullable: true })
  anschrkz: string;
  @Property({type: 'string', name: 'kravers', length: 1, nullable: true })
  kravers: string;
  @Property({type: 'string', name: 'kravnr', length: 20, nullable: true })
  kravnr: string;
  @Property({type: 'string', name: 'krabnr', length: 20, nullable: true })
  krabnr: string;
  @Property({type: 'string', name: 'berufab', length: 1, nullable: true })
  berufab: string;
  @Property({type: 'number', name: 'berufmon', nullable: true })
  berufmon: number;
  @Property({type: 'number', name: 'berufjahr', nullable: true })
  berufjahr: number;
  @Property({type: 'string', name: 'prakt1', length: 1, nullable: true })
  prakt1: string;
  @Property({type: 'string', name: 'prakt2', length: 1, nullable: true })
  prakt2: string;
  @Property({type: 'string', name: 'sonsttaet', length: 1, nullable: true })
  sonsttaet: string;
  @Property({type: 'number', name: 'gesadauer', nullable: true })
  gesadauer: number;
  @Property({type: 'number', name: 'prakdauer', nullable: true })
  prakdauer: number;
  @Property({type: 'string', name: 'erhskfz', length: 4, nullable: true })
  erhskfz: string;
  @Property({type: 'string', name: 'erhsart', length: 2, nullable: true })
  erhsart: string;
  @Property({type: 'number', name: 'erhssembrd', nullable: true })
  erhssembrd: number;
  @Property({type: 'number', name: 'erstsemhs', nullable: true })
  erstsemhs: number;
  @Property({type: 'number', name: 'hssem', nullable: true })
  hssem: number;
  @Property({type: 'number', name: 'urlsem', nullable: true })
  urlsem: number;
  @Property({type: 'number', name: 'praxsem', nullable: true })
  praxsem: number;
  @Property({type: 'string', name: 'prax1', length: 1, nullable: true })
  prax1: string;
  @Property({type: 'string', name: 'prax2', length: 1, nullable: true })
  prax2: string;
  @Property({type: 'number', name: 'kolsem', nullable: true })
  kolsem: number;
  @Property({type: 'number', name: 'klinsem', nullable: true })
  klinsem: number;
  @Property({type: 'number', name: 'ddrsem', nullable: true })
  ddrsem: number;
  @Property({type: 'string', name: 'ddrart', length: 1, nullable: true })
  ddrart: string;
  @Property({type: 'number', name: 'stuntsem', nullable: true })
  stuntsem: number;
  @Property({type: 'string', name: 'staukfz1', length: 3, nullable: true })
  staukfz1: string;
  @Property({type: 'number', name: 'staumon1', nullable: true })
  staumon1: number;
  @Property({type: 'string', name: 'stauart1', length: 1, nullable: true })
  stauart1: string;
  @Property({type: 'string', name: 'staukfz2', length: 3, nullable: true })
  staukfz2: string;
  @Property({type: 'number', name: 'staumon2', nullable: true })
  staumon2: number;
  @Property({type: 'string', name: 'stauart2', length: 1, nullable: true })
  stauart2: string;
  @Property({type: 'string', name: 'staukfz3', length: 3, nullable: true })
  staukfz3: string;
  @Property({type: 'number', name: 'staumon3', nullable: true })
  staumon3: number;
  @Property({type: 'string', name: 'stauart3', length: 1, nullable: true })
  stauart3: string;
  @Property({type: 'string', name: 'wahlkz', length: 6, nullable: true })
  wahlkz: string;
  @Property({type: 'string', name: 'wahlfb', length: 4, nullable: true })
  wahlfb: string;
  @Property({type: 'string', name: 'antizudtxt', length: 30, nullable: true })
  antizudtxt: string;
  @Property({type: 'string', name: 'zusastrasse', length: 30, nullable: true })
  zusastrasse: string;
  @Property({type: 'string', name: 'zusaort', length: 30, nullable: true })
  zusaort: string;
  @Property({type: 'string', name: 'ord_kuenstname', length: 255, nullable: true })
  ord_kuenstname: string;
  @Property({type: 'string', name: 'gebland', length: 3, nullable: true })
  gebland: string;
  @Property({type: 'string', name: 'dokvorname', length: 255, nullable: true })
  dokvorname: string;
  @Property({type: 'string', name: 'zvs_zusatz', length: 154, nullable: true })
  zvs_zusatz: string;
  @Property({type: 'number', name: 'bewnrhist', nullable: true })
  bewnrhist: number;
  @Property({type: 'string', name: 'tnaustausch', length: 1, nullable: true })
  tnaustausch: string;
  @Property({type: 'string', name: 'titel_nachgestellt', length: 25, nullable: true })
  titel_nachgestellt: string;
  @Property({type: 'number', name: 'basem', nullable: true })
  basem: number;
  @Property({type: 'date', name: 'baabdatum', nullable: true })
  baabdatum: Date;
  @Property({type: 'number', name: 'akdsem', nullable: true })
  akdsem: number;
  @Property({type: 'date', name: 'akdabdatum', nullable: true })
  akdabdatum: Date;
  @Property({type: 'string', name: 'erfassungsart', length: 1, nullable: true })
  erfassungsart: string;
  @Property({type: 'string', name: 'zustimmung_alumni', length: 1, nullable: true })
  zustimmung_alumni: string;
  @Property({type: 'string', name: 'ersthzbart', length: 2, nullable: true })
  ersthzbart: string;
  @Property({type: 'date', name: 'ersthzbdatum', nullable: true })
  ersthzbdatum: Date;
  @Property({type: 'string', name: 'ersthzbkfzkz', length: 1, nullable: true })
  ersthzbkfzkz: string;
  @Property({type: 'string', name: 'ersthzbkfz', length: 4, nullable: true })
  ersthzbkfz: string;
  @Property({type: 'number', name: 'ersthzbnote', nullable: true })
  ersthzbnote: number;
  @Property({type: 'number', name: 'ersthzbjahr', nullable: true })
  ersthzbjahr: number;
  @Property({type: 'string', name: 'bid', length: 20, nullable: true })
  bid: string;
  @Property({type: 'string', name: 'ban', length: 6, nullable: true })
  ban: string;
  @Property({type: 'string', name: 'stuntart', length: 2, nullable: true })
  stuntart: string;
  @Property({type: 'string', name: 'erhsstaat', length: 3, nullable: true })
  erhsstaat: string;
  @Property({type: 'string', name: 'zweitstaat', length: 3, nullable: true })
  zweitstaat: string;
  @Property({type: 'date', name: 'datlnacherfassung', nullable: true })
  datlnacherfassung: Date;

}
