import { Button,Checkbox,message,InputNumber } from 'antd';
import * as React from 'react';
import * as methodsDef from "../../assets/methodsDef.json";
import { IMethod, IDatarun, IClassifier } from "types";
import { IConfigsInfo,INewDatarunResponse } from 'service/dataService';
import { getConfigs,postNewDatarun} from 'service/dataService';
//import { IDatarun } from "types";
//import { getColor ,RED,YELLOW, getGradientColor} from 'helper';
import { getColor } from 'helper';
import "./MethodsLineChart.css";
//import ReactEcharts from "echarts-for-react";
/*const sortSwitchStyle = {
     position: "absolute" as "absolute",
     top: "5px",
     right: "5px"
 }*/
export interface IState {
    mode : number,
    selectedMethodName : string[],
    selectedHyperpartitionName :string,
    loading : boolean ,
    configsMethod : string[],
    configsBudget:number
}
export interface IProps {
    height: number,
    datarun: IDatarun,
    datasetID: number | null,
    setDatarunID: (id: number) => void
}
export interface ChartProps {
    width: number,
    height: number,
    x: number,
    y: number,
    methodDef: IMethod,
    classifiers : IClassifier[],
    name:string,
    totallen?:number,
    methodName?:string,
    onClick:(a:string)=>void,
    selected?:boolean,
    

}
export interface DetailChartProps{
    width: number,
    height: number,
    x: number,
    y: number,
    methodDef: IMethod,
    classifiers : IClassifier[],
    name:string,
    min:number,
    max:number,
    hyname:string
}
export interface HyperpartitionHeatmapProps{
    width: number,
    height: number,
    x: number,
    y: number,
    methodDef: IMethod,
    classifiers : IClassifier[],
    name:string,
    totallen?:number,
    methodName?:string,
    onClick:(a:string)=>void,
    selected?:boolean,    
    hpname:string,
    methodSelected:boolean
}
export default class MethodsLineChart extends React.Component<IProps, IState>{
    constructor(props:IProps){
        super(props);
        let usedMethods:any[] = Object.keys(this.props.datarun);
        this.state={
            mode : 0,
            selectedMethodName :[],
            selectedHyperpartitionName : "",
            loading:false,
            configsMethod:usedMethods,
            configsBudget:1000
        };
        
    }
    index = 0;
    
    displayMethod = [];
    allMethods = [];
    onMethodsOverViewClick = (Methods:string)=>{
        // Show Methods
        console.log("onclick");
        let selectedMethodName:string[] = this.state.selectedMethodName;
        let  i = selectedMethodName.indexOf(Methods);
        if (i > -1) {
            selectedMethodName.splice(i, 1);
            this.setState({
                selectedMethodName : selectedMethodName
            });
        }else{
            selectedMethodName.push(Methods);
        
            if(this.state.mode==0){
                this.setState({
                    mode : 1,
                    selectedMethodName : selectedMethodName
                });
            }else{
                this.setState({
                    selectedMethodName : selectedMethodName
                });
            }
        }

        
    };
    onHyperpartitionsOverViewClick = (HyperpatitionName:string)=>{
        //alert("onclick "+HyperpatitionName);
        this.setState({
            mode : 2,
            selectedHyperpartitionName : HyperpatitionName
        });
    };
    public getbestperformance(list:IClassifier[]){
        if(list.length>0){
            let classifierPerformance:number[]=list.map((classifier:IClassifier)=>{
                let performance = parseFloat(classifier['performance'].split(' +- ')[0]);
                return performance;
            });
            classifierPerformance.sort(function(a:any,b:any){
                return b-a;
            });
            return classifierPerformance[0];
        }else{
            return 0;
        }
        
    }
    public getmaxnum(classifiers:IClassifier[]){
        let step = 0.1;
        let data:number[] = [];
        
        for (let i =0; i<=1/step; i++){
            data.push(0)
        }
        let bestperformance = 0;
        classifiers.forEach((classifier:IClassifier)=>{
            let performance = parseFloat(classifier['performance'].split(' +- ')[0]);
            if(performance>bestperformance){
                bestperformance=performance;
            }
            let rangeIdx = Math.floor(performance/step)
            data[rangeIdx] = data[rangeIdx]+1
        });
        let maxvalue = 0;
        data.forEach((p:any)=>{
            if(p>maxvalue){
                maxvalue = p;
            }
        })
        return maxvalue;
    }
    componentDidMount(){
        /*
        const d3 = require("d3");
        let zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", function(){
            let container = d3.select("#top_container");
            //container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            container.attr("transform", d3.event.transform);
        });
        let margin = {left:0,right:0,top:0,bottom:0};
        d3.select("#top_container").attr("transform", "translate(" + margin.left + "," + margin.right + ")").call(zoom);
        */
    }
    componentWillReceiveProps(nextProps : IProps) {
        let { datarun } = nextProps;
        let usedMethods = Object.keys(datarun);
        if(this.state.loading==false){
            this.setState({
                configsMethod:usedMethods
            });
        }
    }
    onCheckBoxChange=(e : any)=>{
        let checked = e.target.checked;
        let value = e.target.value;
        if(checked==false){
            let configsMethod : string[] = this.state.configsMethod;
            let index = configsMethod.indexOf(value);
            if(index>-1){
                configsMethod.splice(index, 1);
                this.setState({
                    configsMethod:configsMethod
                });

            }
        }else{
            let configsMethod : string[] = this.state.configsMethod;
            configsMethod.push(value);
            this.setState({
                configsMethod:configsMethod
            });

            
        }
    }

    
    createNewDataRun = () => {
        // get configs from server ;
        // submit configs in this view
        // switch to the new datarun.
        let methods = this.state.configsMethod;
        let budget = this.state.configsBudget;
        if(this.props.datasetID!=null){
            let promise: Promise<IConfigsInfo>;
            promise = getConfigs();
            promise
                .then(configs => {
                    configs.methods = methods;
                    configs.budget = budget;
                    this.setState({ loading: true });
                    let datasetID : number= this.props.datasetID?this.props.datasetID:0;
                    let promise:Promise<INewDatarunResponse> = postNewDatarun(datasetID,configs);
                    //const promise = this.props.onSubmit(this.state.configs);
                    console.log("post new data run in methods view");
                    console.log(configs);
                    promise.then(status => {
                        if(status.success == true){
                            message.success("Submit Configs Successfully. Datarun ID:"+status.id);
                            this.props.setDatarunID(status.id);
                        }else{
                            message.error("Submit Configs Failed.");
                        }
                        this.setState({ loading: false });
                    }).catch(error=>{
                        console.log(error);
                        message.error("Submit Configs Failed.");
                        this.setState({ loading: false});
                
                    });
                })
                .catch(error => {
                    console.log(error);
                });
                }
       }

       onBudgetChange = (budget : any) =>{
       
        this.setState({configsBudget:budget});
      }


    public render() {
        // const methodLen = Object.keys(methodsDef).length
        let { datarun, height } = this.props;
        let {mode,selectedHyperpartitionName} = this.state;
        let selectedMethodName:string[] = this.state.selectedMethodName;
        selectedHyperpartitionName;
        let usedMethods: string[] = Object.keys(datarun);
        let totallen = 0;
        usedMethods.forEach((name: string, i: number)=>{
            const classifier_num = datarun[name].length;
            totallen+=classifier_num;
        })
        let hyperpartitionData : IDatarun= {};
        let hyperpartition2Method : {[hyperpartition:string]:string}= {};
        let Method2hyperpartition : {[method:string]:string[]} = {};
        usedMethods.forEach((name: string, i: number) => {
            const methodDef = methodsDef[name];
            const classifiers = datarun[name];
            let parameterList: any[] = [];
            let idx = 0;
            methodDef.root_hyperparameters.forEach((p: string) => {
                let parameter = methodDef['hyperparameters'][p]
                if (parameter['values']) { //category axis
                    parameterList.push({ dim: idx, name: p, type: 'category', data: parameter['values'] })
                }
            })
            classifiers.forEach(((classifier: IClassifier, idx: number) => {
                let par_dict = {}
                let parameters = classifier['parameters'].split('; ')
                parameters = parameters.map((p: string) => {
                    let [k, v] = p.split(' = ')
                    return par_dict[k] = v
                })
                // for the hidden layer sizes in MLP
    
                if (par_dict['len(hidden_layer_sizes)']) {
                    for (let i = parseInt(par_dict['len(hidden_layer_sizes)']); i < 3; i++) {
                        par_dict[`hidden_layer_sizes[${i}]`] = 0
                    }
                }
    
                // add perforamce
                par_dict['performance'] = parseFloat(classifier['performance'].split(' +- '))
                let ScatterPlotCategory : any[] = [methodDef.fullname];
                parameterList.forEach(p => {
                    let value = par_dict[p.name]
                    if (p.type == 'category') {
                        ScatterPlotCategory.push(p.name+":"+value);
                    }
                });
                let HyperpartitionName = ScatterPlotCategory.join("\n");
                if(!Method2hyperpartition[name]){
                    Method2hyperpartition[name]=[];
                }
                if(!hyperpartitionData[HyperpartitionName]){
                    hyperpartitionData[HyperpartitionName] = [];
                    Method2hyperpartition[name].push(HyperpartitionName);
                }
                hyperpartitionData[HyperpartitionName].push(classifier);
                hyperpartition2Method[HyperpartitionName] = name;
                
                
            }
            )); 
        });

        //let usedHyperpartitions: string[] = Object.keys(hyperpartitionData);
        if(mode==1||mode==2){
            //is method name exist?
            let flag = 0;
            let len = selectedMethodName.length;
            for(let i = 0;i<len;i++){
                const methodDef = methodsDef[selectedMethodName[i]];
                if(!methodDef||!Method2hyperpartition[selectedMethodName[i]]){
                    flag= 1;
                    break;
                }
            }
            if(len==0){
                flag=1;
            }
            if(flag){
                mode=0;
                selectedHyperpartitionName="";
                selectedMethodName=[];
                console.log("roll back");
                this.setState({
                    mode : 0,
                    selectedMethodName:[],
                    selectedHyperpartitionName : ""
                });
            }
        }
        
            
        if(mode==2){
            const methodDef = methodsDef[hyperpartition2Method[selectedHyperpartitionName]];
            if(!methodDef||!hyperpartitionData[selectedHyperpartitionName]){
                mode=0;
                selectedHyperpartitionName="";
                selectedMethodName=[];
                console.log("roll back also");
                this.setState({
                    mode : 0,
                    selectedMethodName:[],
                    selectedHyperpartitionName : ""
                });
            }
        }
    

        // const usedMethods = ['SVM', 'RF', 'DT', 'MLP',,'GP', 'LR', 'KNN'] // the used methodsDef should be obtained by requesting server the config file
        const unusedMethods = Object.keys(methodsDef).filter((name: string) => usedMethods.indexOf(name) < 0)
        
        let hpname :string[]= [];
        usedMethods.forEach((name: string, i: number) =>{
            hpname = hpname.concat(Method2hyperpartition[name]);
        });
        let performance = usedMethods.map((name: string, i: number) =>{
           return {value:this.getbestperformance(datarun[name]),name:name};
        });
        performance.sort(function(a:any,b:any){
            return b.value-a.value;
        });
        let sortedusedMethods = performance.map((d:any)=>{
            return d.name;
        });
        let maxnum = 1;
        // calculate the max num
        sortedusedMethods.forEach((name: string, i: number)=>{
            let num = this.getmaxnum(datarun[name]);
            if(num>maxnum){
                maxnum=num;
            }

        });
   
        let generateHp = ()=>{
            if(mode==1||mode==2){
                let gap = 20;
                let nowx = 2;
                let lastwidth = 0;
                let hpheight = 73;
                let hpmargin = 12;
                let rectwidth = 5;
                let rectheight = 5;
                let verticalnum = Math.floor((hpheight-hpmargin)/(rectheight+1));

                    // horizontalnum should be set to be Math.ceil(num/verticalnum) 
                    //let horizontalnum = Math.floor(width/(rectwidth+1));
                let hpname :string[]= [];
                selectedMethodName.forEach((name: string, i: number) =>{
                    hpname = hpname.concat(Method2hyperpartition[name]);
                });
                let performance = hpname.map((name: string, i: number) =>{
                    return {value:this.getbestperformance(hyperpartitionData[name]),name:name};
                });
                performance.sort(function(a:any,b:any){
                    return b.value-a.value;
                });
                let sortedhpname = performance.map((d:any)=>{
                    return d.name;
                });
                
                let pathgenerator:any[] = [];
                let array = sortedhpname.map((name: string, i: number) => {
                    let selected = selectedHyperpartitionName===name;
                    
                    nowx+=lastwidth;lastwidth=0;
                    const selectedMethod = hyperpartition2Method[name];
                    const methodDef = methodsDef[selectedMethod];

                    let methodselected = selected;
                    if(methodselected==false){
                        const nowselectedMethod = hyperpartition2Method[selectedHyperpartitionName];
                        if(nowselectedMethod===selectedMethod){
                            methodselected=true;
                        }
                    }


                    const hplen:number = hyperpartitionData[name].length;
                    let horizontalnum = Math.ceil(hplen/verticalnum);
                    let hpwidth = hpmargin + horizontalnum * (rectwidth+1);
                    lastwidth = hpwidth+gap;
                    let  index0 = sortedusedMethods.indexOf(selectedMethod);
                    if(index0>-1)
                    {
                        let x1 = (2+index0*85)+35;
                        let y1 = 100;
                        let x2 = nowx+hpwidth/2;
                        let y2 = 30+85+100;
                        pathgenerator.push({
                            x1:x1,
                            x2:x2,
                            y1:y1,
                            y2:y2,
                            color:getColor(methodDef.name)
                        })
                    }
                    
                return (<HyperpartitionHeatmap 
                    key={name+"_used_"+(++this.index)} 
                    x={nowx} 
                    y={30+85+100} 
                    width={hpwidth} 
                    height={hpheight} 
                    methodDef={methodDef} 
                    classifiers={hyperpartitionData[name]} 
                    name={"hp"+this.index} 
                    hpname={name}
                    totallen={totallen} 
                    selected={selected}
                    onClick={this.onHyperpartitionsOverViewClick}
                    methodSelected={methodselected}/>);
             });
                let array2 = pathgenerator.map((node: any, i: number) => {
                        let mean_y = (node.y1 + node.y2) / 2;
                        let pathlang = "M"+node.x1+","+node.y1+"C"+node.x1+","+mean_y+" "+node.x2+","+mean_y+" "+node.x2+","+node.y2;
                        return (<path key={"_path_"+(++this.index)}  
                        d={pathlang} 
                        stroke={node.color}
                        fill="none"
                        strokeWidth={1.5} />);
                });
                return array.concat(array2);
            }else{
                return <g />
            }
        };
        // end of generate Hp 
        
        let generateHpdetail = ()=>{
            if(mode==2){
                console.log("show detail");
                const selectedMethod : string = hyperpartition2Method[selectedHyperpartitionName];
                const methodDef = methodsDef[selectedMethod];

                let HyperparameterList: any[] = [];
                let idx = 0
                let rangeMap : any ={};
                methodDef.root_hyperparameters.forEach((p: string) => {
                    let parameter = methodDef['hyperparameters'][p]
                    if (parameter['values']) { //category axis
                    } else if (parameter['range']) {//value axis
                        if (parameter['range'].length > 1) { //range in the form of [min, max]
                            HyperparameterList.push({ dim: idx, name: p, type: 'value', min: parameter['range'][0], max: parameter['range'][1] })
                        } else { // range in the form of [max]
                            HyperparameterList.push({ dim: idx, name: p, type: 'value', min: 0, max: parameter['range'][0] })
                        }
        
                    } else if (parameter['type'] == 'list') { // the hidden layer sizes in MLP
                        for (let hidden_l = 0; hidden_l < parameter['list_length'].length; hidden_l++) {
        
                            HyperparameterList.push({
                                dim: idx + hidden_l, name: `${p}[${hidden_l}]`, type: 'value',
                                min: 0,
                                max: parameter['element']['range'][1]
                            })
                        }
                        idx = idx + parameter['list_length'].length - 1
        
                    } else {
                        HyperparameterList.push({
                            dim: idx, name: p, type: 'value'
                        })
                    }
                })
                HyperparameterList.map((data:any,index:number)=>{
                    rangeMap[data.name]={min:data.min,max:data.max};
                });
                let hyperparameterData : any = {};
                //let totallen = classifiers.length;
                let pushData = (classifier: IClassifier, idx: number , selected:boolean) =>{
                    let par_dict = {}
                    let parameters = classifier['parameters'].split('; ')
                    parameters = parameters.map((p: string) => {
                        let [k, v] = p.split(' = ')
                        return par_dict[k] = v
                    })
                    // for the hidden layer sizes in MLP
        
                    if (par_dict['len(hidden_layer_sizes)']) {
                        for (let i = parseInt(par_dict['len(hidden_layer_sizes)']); i < 3; i++) {
                            par_dict[`hidden_layer_sizes[${i}]`] = 0
                        }
                    }
        
                    // add perforamce
                    par_dict['performance'] = parseFloat(classifier['performance'].split(' +- '));
                    let performance = parseFloat(classifier['performance'].split(' +- ')[0])
                    //let trailID : number = classifier['trail ID'];
                    HyperparameterList.forEach(p => {
                        let value = par_dict[p.name]
                        if (p.type == 'value') {
                            if(!hyperparameterData[p.name]){
                                hyperparameterData[p.name]=[];
                            }
                            let thisvalue = parseFloat(value);
                            hyperparameterData[p.name].push({value:thisvalue,performance:performance,selected:selected});
                            
                        } else {
                            //return value;
                        }
                    })
                    
                }
               
                Method2hyperpartition[selectedMethod].forEach((value:string,index:number)=>{
                    if(value!=selectedHyperpartitionName){
                        hyperpartitionData[value].forEach(((classifier: IClassifier, idx: number) => {
                            pushData(classifier,idx,false);
                        }
                        ));
                    }else{
                        hyperpartitionData[value].forEach(((classifier: IClassifier, idx: number) => {
                            pushData(classifier,idx,true);
                        }
                        ));
                    }
                })
                let keys = Object.keys(hyperparameterData);
               
                let array = (keys.map((name:string,index:number)=>{
                    return (<DotBarChart x={2+5+20+160*index} 
                        y={30+5+85+100+73+30+3} 
                        width={150} 
                        height={205} 
                        min={rangeMap[name].min}
                        max={rangeMap[name].max}
                        methodDef={methodDef} 
                        classifiers={hyperparameterData[name]} 
                        hyname={name}
                        name={"hpd"+(++this.index)} 
                        key={"hpdetail"+(++this.index)}/>)
                }));
                let finalwidth = 5+20+160*(keys.length);
                    
                let array2=  (<rect key={'_rect_'+(++this.index)} x={2} y={30+85+100+73+30-2} width={finalwidth} height={220} fill="none" strokeWidth={2} stroke="#E0D6D4" />)
                    
                
                return array.concat(array2);
                
            }else{
                return <g />
            }
        };
        console.log("render");
        let allmethods = sortedusedMethods.concat(unusedMethods);
        console.log(allmethods.length);
        /**
         * <foreignObject key={"submit_"+(++this.index)} y={480} x={1100} width="120" height="50">
                        <Button key={"_button_"+(++this.index)}>Submit</Button>
                            </foreignObject>
         */
        /**
         * {allmethods.map((name: string, i: number) => {
                               
                               //return (<text key={name+"_text_"+this.index} x={2+i*85+35}  y={2+20} width={70} textAnchor="middle" fontFamily="sans-serif" fontSize="20px" fill="black">{name}</text>)
                               return (<div key={name+"_text_"+(++this.index)} style={{position: "absolute",left:(20+i*85)+"px",top:"120px"}} >
                                      
                                       <Checkbox  key={name+"_checkbox_"+(++this.index)}  >{name}</Checkbox></div>
                               
                                  )
                           })}
         * 
         */
        return (<div className="methods" id="methodstop" style={{height: height+'%', borderTop: ".6px solid rgba(0,0,0, 0.4)"}}>
            <div className="usedMethodContainer"
                    style={{ height: "100%", width: "100%" }}>
                        <div style={{position: "absolute",bottom:"10px",right:"50px"}}>
                        <h4>Budget</h4>
                        <InputNumber min={1} value={this.state.configsBudget} style={{ width: "130px" }} onChange={this.onBudgetChange} />
                        <br /><Button key={"_button_"+(++this.index)} loading={this.state.loading} onClick={this.createNewDataRun}>Create New Data Run</Button>
                        <br /><Button key={"_button_"+(++this.index)}>Update Hyperparameters Range</Button></div>
                        
                        <svg style={{ height: '100%', width: '100%' }} id="chart" xmlns="http://www.w3.org/2000/svg">
                        
                            <g id="top_container">
                            {allmethods.map((name: string, i: number) => {
                               let checked = false;
                               let configsMethod : string[] = this.state.configsMethod;
                               if(configsMethod.indexOf(name)>-1){
                                    checked= true;
                            };
                               //return (<text key={name+"_text_"+this.index} x={2+i*85+35}  y={2+20} width={70} textAnchor="middle" fontFamily="sans-serif" fontSize="20px" fill="black">{name}</text>)
                               return (<foreignObject key={name+"_text_"+(++this.index)} x={2+i*85} y={2} width={75} height={30}>
                                      
                                       <Checkbox  key={name+"_checkbox_"+(++this.index)} checked={checked} value={name} onChange={this.onCheckBoxChange} >{name}</Checkbox></foreignObject>
                               
                                  )
                                 /* return  <Checkbox 
                                    style={{
                                        position:'absolute',
                                        left:2+i*85,
                                        top: 2,
                                        width:75,
                                        height:30
                                            // transform:"translate("+(2+i*85)+","+(2)+")"
                                    }} 
                                    key={name+"_checkbox_"+(++this.index)} 
                                    checked={checked} value={name} onChange={this.onCheckBoxChange} 
                                    >
                                  {name}
                                  </Checkbox>*/

                               
                                  
                           })}
                            {sortedusedMethods.map((name: string, i: number) => {
                                const methodDef = methodsDef[name];
                                let  testin = selectedMethodName.indexOf(name);
                                let selected = false;
                                if (testin > -1) {
                                    selected = true;
                                }
                                //const classifier_num = datarun[name].length;
                                //const top_width = classifier_num*6+60;
                                this.index++;
                                return (
                                <LineChart key={name+"_used_"+this.index} 
                                        x={2+i*85} 
                                        y={30} 
                                        width={70} 
                                        height={70} 
                                        methodDef={methodDef} 
                                        classifiers={datarun[name]} 
                                        name={name} 
                                        totallen={maxnum} 
                                        onClick={this.onMethodsOverViewClick}
                                        selected={selected}
                                        />)
                                    
                            })}
                            {
                                unusedMethods.map((name: string,i:number) => {
                                    let index = i+sortedusedMethods.length;
                                return (<rect key={name + '_unused'} strokeDasharray="5,5" x={2+index*85} y={30} width={70} height={70} fill="white" strokeWidth={2} stroke="#E0D6D4" />)})
                                
                            }
                            {generateHp()}
                            {generateHpdetail()}
                            </g>
                         </svg>  
                    </div>
                </div>)
    
      
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//  The main component presented above.
//
//
//
///////////////////////////////////////////////////////////////////////////////////////////////////////
class LineChart extends React.Component<ChartProps, {}>{
    TAG = "LineChart_";
    componentDidMount() {
        this.renderD3();
    }
    renderD3() {
        const d3 = require("d3");
        // Get Datasets
        const { methodDef, classifiers,totallen,onClick,selected } = this.props;
        let step = 0.1;
        let data:number[] = [];
        
        for (let i =0; i<=1/step; i++){
            data.push(0)
        }
        let bestperformance = 0;
        classifiers.forEach((classifier:IClassifier)=>{
            let performance = parseFloat(classifier['performance'].split(' +- ')[0]);
            if(performance>bestperformance){
                bestperformance=performance;
            }
            let rangeIdx = Math.floor(performance/step)
            data[rangeIdx] = data[rangeIdx]+1
        });
        let total = 0;
        let bestindex = 0;
        let frequentindex = 0;
        let maxfrequency = 0;
        data.forEach((d:any,i:any)=>{
            if(d>0&&i>bestindex){
                bestindex=i;
            }
            if(d>maxfrequency){
                frequentindex=i;
                maxfrequency=d;
            }
            total+=d;
        });
        //total;
        let yAxisData:string[] = []
        for (let i =0; i<=1/step; i++){
            yAxisData.push(`${(i*step).toFixed(2)}`)
        }
        
        // g
        // Set the dimensions of the canvas / graph
        //let	margin = {top: 0, right: 0, bottom: 0, left: 0},
        let	margin = {top: 6, right: 6, bottom: 6, left: 6},
            width = this.props.width - margin.left - margin.right,
            height = this.props.height - margin.top - margin.bottom,
            top_margin = {top:this.props.y,left:this.props.x};

        // Set the ranges
        let	xScale = d3.scaleLinear().range([0, width]);
        let	yScale = d3.scaleLinear().range([height, 0]);
        

        xScale.domain([0, totallen]);
        yScale.domain([0, 1]);
        //Create SVG element
        let tooltip = d3.select("#tooltip");
        //let top_methods = d3.select("#methodstop");

        if(tooltip.empty()){
            tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id","tooltip")
            .style("opacity", 0)
            .style("left",  "0px")
              .style("top",  "0px");;
        }
        let top_svg = d3.select("#"+this.TAG+this.props.name).attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).attr("transform", "translate(" + top_margin.left + "," + top_margin.top + ")")
        .on("click",()=>{onClick(this.props.name)})
        .on("mousemove", function(d:any) {
            
            tooltip.transition()
              .duration(100)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
              tooltip.style("opacity", 0.7).html(methodDef.fullname+"<br/>"+"best performance:"+bestperformance.toFixed(2) + "<br/>" + "trial number:"+total)
             
            })
            
          .on("mouseout", function(d:any) {
            tooltip
              .style("opacity", 0);
            });;
        top_svg.append("rect")
        .attr("x",0)
        .attr("y",0)
        .attr("width", width + margin.left + margin.right)
        .attr("height",height + margin.top + margin.bottom)
        .attr("fill","white")
        .attr("stroke-width",2)
        .attr("stroke",selected?"#A4A0A0":"#E0D6D4")
        ;
        let svg = top_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var line = d3.line()
        .x(function(d:any, i:any) { return xScale(d); }) // set the x values for the line generator
        .y(function(d:any,i:any) { return yScale((i)*step); }) // set the y values for the line generator 
        .curve(d3.curveMonotoneX) // apply smoothing to the line


        function generateArray(index:number){
            let data:any[] = [];
            data.push({x:0,y:index*step});
            data.push({x:totallen,y:index*step});
            return data;
        }

        var straightline = d3.line()
            .x(function(d:any, i:any) { return xScale(d.x); }) // set the x values for the line generator
            .y(function(d:any,i:any) { return yScale(d.y); }) // set the y values for the line generator
        svg.append("path")
            .datum(generateArray(bestindex)) 
            .attr("class", "line") 
            .attr("fill","none")
            .attr("stroke","#E0D6D4")
            .attr("stroke-width",2)
            .attr("stroke-dasharray","5,5")
            .attr("d", straightline); 
        svg.append("path")
            .datum(generateArray(frequentindex)) 
            .attr("class", "line") 
            .attr("fill","none")
            .attr("stroke","#E0D6D4")
            .attr("stroke-width",2)
            .attr("stroke-dasharray","5,5")
            .attr("d", straightline); 
        svg.append("path")
            .datum(data) 
            .attr("class", "line") 
            .attr("fill","none")
            .attr("stroke",getColor(methodDef.name))
            .attr("stroke-width",2)
            .attr("d", line); 
      }
    render() {
        const {name}=this.props;
        return <g id={this.TAG+name}/>
    }
}


class HyperpartitionHeatmap extends React.Component<HyperpartitionHeatmapProps, {}>{
    TAG = "HyperpartitionHeatmap_";
    componentDidMount() {
        this.renderD3();
    }
    renderD3() {
        const d3 = require("d3");
        // Get Datasets
        const { methodDef, classifiers,onClick ,selected,methodSelected} = this.props;
        let bestperformance = 0;
        let classifierPerformance:number[]=classifiers.map((classifier:IClassifier)=>{
            let performance = parseFloat(classifier['performance'].split(' +- ')[0]);
            return performance;
        });
        classifierPerformance.sort(function(a:any,b:any){
            return b-a;
        });
        if(classifierPerformance.length>0){
            bestperformance = classifierPerformance[0];
        }
        let total = classifierPerformance.length;

         // g
        // Set the dimensions of the canvas / graph
        //let	margin = {top: 0, right: 0, bottom: 0, left: 0},
        let	margin = {top: 6, right: 6, bottom: 6, left: 6},
            width = this.props.width - margin.left - margin.right,
            height = this.props.height - margin.top - margin.bottom,
            top_margin = {top:this.props.y,left:this.props.x};
        //Create SVG element

        //Create SVG element
        let tooltip_hp = d3.select("#tooltip");
        //let top_methods = d3.select("#methodstop");

        if(tooltip_hp.empty()){
            tooltip_hp = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id","tooltip")
            .style("opacity", 0)
            .style("left",  "0px")
            .style("top",  "0px");;
        }

        let top_svg = d3.select("#"+this.TAG+this.props.name).attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).attr("transform", "translate(" + top_margin.left + "," + top_margin.top + ")")
        .on("click",()=>{onClick(this.props.hpname)})
        .on("mousemove", function(d:any) {
            
            tooltip_hp.transition()
              .duration(100)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
              tooltip_hp.style("opacity", 0.7).html(methodDef.fullname+"<br/>"+"best performance:"+bestperformance.toFixed(2) + "<br/>" + "trial number:"+total)
             
            })
            
          .on("mouseout", function(d:any) {
            tooltip_hp
              .style("opacity", 0);
            });;;
        top_svg.append("rect")
        .attr("x",0)
        .attr("y",0)
        .attr("width", width + margin.left + margin.right)
        .attr("height",height + margin.top + margin.bottom)
        .attr("fill","white")
        .attr("stroke",selected?"#424242":methodSelected?"#B19F9B":"#E0D6D4")
        .attr("stroke-width",2);
        let svg = top_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let rectwidth = 5;
        let rectheight = 5;
        //let verticalnum = Math.floor(height/(rectheight+1));
        // horizontalnum should be set to be Math.ceil(num/verticalnum) 
        let horizontalnum = Math.floor(width/(rectwidth+1));

        let groups = svg
            .append('g')
            .attr("class", "group");
        let rect_scale = 0.5;
        let rectArray = groups.selectAll("g.rectArray")
        .data(classifierPerformance);
        //console.log(classifierPerformance.length);
        rectArray.enter()
        .append("rect")
        .style("fill",getColor(methodDef.name))
        //.attr("fill-opacity",function(d:any,i:any){return d*0.9+0.1;})
        .attr("width", function(d:any,i:any) {return (d*rect_scale+1-rect_scale)*rectwidth;})
        .attr("height", function(d:any,i:any){return (d*rect_scale+1-rect_scale)*rectheight;})
        .attr("x", function(d:any,i:any) {
            let thiswidth = (d*rect_scale+1-rect_scale)*rectwidth;
            return  (i%horizontalnum)*(rectwidth+1)+(rectwidth-thiswidth)/2.0;})
        .attr("y", function(d:any,i:any) { 
            let thisheight = (d*rect_scale+1-rect_scale)*rectheight;
            return  Math.floor(i/horizontalnum)*(rectheight+1)-thisheight/2.0;
        });
        
            

        
    }

    render() {
        const {name}=this.props;
        return <g id={this.TAG+name}/>
    }
}


class DotBarChart extends React.Component<DetailChartProps, {}>{
    TAG = "DotBarChart_";
    componentDidMount() {
        this.renderD3();
    }
    renderD3() {
        const d3 = require("d3");
        // Get Datasets

        const { methodDef, classifiers ,min,max} = this.props;

        let	margin = {top: 0, right: 0, bottom: 20, left: 25},
            width = this.props.width - margin.left - margin.right,
            height = this.props.height - margin.top - margin.bottom,
            top_margin = {top:this.props.y,left:this.props.x};

        let totaltick = height/6;
        let step = (max-min)/totaltick;
        let histogram:number[] = [];
        
        for (let i =0; i<totaltick; i++){
            histogram.push(0)
        }
        let displaydata:any[]=[];
        let markerdata:any[]=[];
        let datacluster:any={};
        
        console.log("length");
        console.log(classifiers.length);
        classifiers.forEach((classifier:any)=>{
            // let performance = classifier.performance;
            //let rangeIdx = Math.floor(performance/step)
            let value = classifier.value;
            let rangeIdx = Math.floor((value-min)/step)
            if(rangeIdx>=totaltick){
                rangeIdx=totaltick-1;
            }
            if(!datacluster[rangeIdx]){
                datacluster[rangeIdx]=[];
            }
            let opacity = classifier.selected? 1:0.3;
            datacluster[rangeIdx].push({performance:classifier.performance,opacity:opacity});
            //let data = {idx:rangeIdx,performance:classifier.performance};

            //let data = {y:(rangeIdx+0.5)*1/totaltick,x:histogram[rangeIdx],performance:classifier.performance};
            //displaydata.push(data);
            //histogram[rangeIdx] = histogram[rangeIdx]+1;
            
        });
        let dkeys = Object.keys(datacluster);
        let maxhorizontalnum = 19;
        dkeys.map((value:string)=>{
            let rangeIdx = parseInt(value);
            datacluster[value].sort(
                function(a:any,b:any){
                    return b.performance-a.performance;
                }
            )
            
            datacluster[value].map((obj:any,i:number)=>{
                //console.log("performance"+performance);
                if(i<maxhorizontalnum){
                    let data = {y:(rangeIdx+0.5)*1/totaltick,x:i,performance:obj.performance,opacity:obj.opacity};
                    displaydata.push(data);
                }
            });
            if(datacluster[value].length>maxhorizontalnum){
                markerdata.push({y:(rangeIdx+0.5)*1/totaltick,x:maxhorizontalnum});
            }
            
            
        })
        // Set the ranges
        let	yScale = d3.scaleLinear().range([height, 0]);
        yScale.domain([0, 1]);
        let yScale2 = d3.scaleLinear().range([height, 0]);
        yScale2.domain([min, max]);
        //let axisticks = 10;
        let yAxis = d3.axisLeft()
                    .scale(yScale2);
                    //.tickFormat(function (d:any) {
                    //    console.log("d"+d);
                    //    return (min+(max-min)*d).toFixed(2);
                    //})
                    //.ticks(axisticks);

        
        //Create SVG element
        let top_svg = d3.select("#"+this.TAG+this.props.name).attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom).attr("transform", "translate(" + top_margin.left + "," + top_margin.top + ")");;
        // text label for the x axis
        top_svg.append("text")             
        .attr("transform",
                "translate(" + (0) + " ," + 
                            (height + margin.top + 20) + ")")
        .style("text-anchor", "start")
        .text(this.props.hyname);
        let svg = top_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Create Y axis
        let g_axis = svg.append("g")
            .attr("transform", "translate(0,0)")
            .attr("class", "bundle-axis")
            
        g_axis.append("g")
        .attr("transform", "translate(0,0)")
        .attr("class", "y axis").call(yAxis);


        function brushended() {
            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.
            let d0 = d3.event.selection.map(yScale2.invert);
            let min = d0[1];
            let max = d0[0];
            console.log("brush min max");
            console.log(min);
            console.log(max);
          }
          


        g_axis.append("g")
        .attr("class", "brush")
        .call(d3.brushY()
            .extent([[-6, 0], [6, height]]).on("end", brushended));
        let groups = svg
            .append('g')
            .attr("class", "group");

        let rectArray = groups.selectAll("g.rectArray")
        .data(displaydata);
        let rectwidth : number= 5;
        let rectheight : number = 5;
        let rect_scale = 0.5;
        rectArray.enter()
        .append('g')
        .attr("class", "rectArray")
        .append("rect")
        .style("fill",getColor(methodDef.name))
        .style("opacity",function(d:any,i:any){return d.opacity;})
        .attr("width", function(d:any,i:any) {return (d.performance*rect_scale+1-rect_scale)*rectwidth;})
        .attr("height",function(d:any,i:any) {return (d.performance*rect_scale+1-rect_scale)*rectheight;})
        .attr("x", function(d:any,i:any) {
            let width = (d.performance*rect_scale+1-rect_scale)*rectwidth;
            return d.x*6+rectwidth/2.0-width/2.0; 
        })
        .attr("y", function(d:any,i:any) { 
            let height = (d.performance*rect_scale+1-rect_scale)*rectheight;
            return yScale(d.y)-2.5+rectheight/2.0-height/2.0; });
        function generateMarkerPath(x:number,y:number,width:number,height:number){
            let x1=x;
            let y1=y;
            let x2= x+width;
            let y2 = y+height/2;
            let x3 = x;
            let y3 = y+height;
            return "M"+x1+" "+y1+" L"+x2+" "+y2+" L"+x3+" "+y3+" Z";
        }
        let markerArray = groups.selectAll("g.marker").data(markerdata);
        markerArray.enter()
        .append('g')
        .attr("class","marker")
        .append('path')
        .attr("fill",getColor(methodDef.name))
        .attr("d",function(d:any,i:any){return generateMarkerPath(d.x*6,yScale(d.y)-2.5,rectwidth,rectheight);})

      }
    render() {
        const {name}=this.props;
        return <g id={this.TAG+name}/>
    }
}