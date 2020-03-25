//////////////////////////////////////////////////////////
/* Extract from csv file                                */
/* Source: Crédit Suisse                                */
//////////////////////////////////////////////////////////
function load_data() {
  d3.tsv('./source/WorldWealth.csv').then(dataset => {
    d3.json('./map/world_map.json').then(function(topology) {
      let mapData = topojson.feature(topology, topology.objects.countries)
        .features
        .filter(d => d.properties.name != 'Antarctica')
      dataset = dataset.filter(d => d.Region != '' && d.id != '' && d.Country != '')
      dataset.forEach(d => {
        d['Wealth ($B)'] = parseFloat(d['Wealth ($B)'].substring(1))
        if(d.Region == 'China' || d.Region == 'India'){d.Region = 'Asia-Pacific'}
        if(d.Region == 'America'){d.Region = 'North America'}
      })
      dataset.sort((a,b) => d3.ascending(a['Wealth ($B)'], b['Wealth ($B)']))

      drawSVG(dataset,mapData)
    })    
  })
}

//////////////////////////////////////////////////////////
/* Main                                                 */
//////////////////////////////////////////////////////////
function drawSVG(dataset,mapData){

  //////////////////////////////////////////////////////////
  /* Initialisation                                       */
  //////////////////////////////////////////////////////////

  // Default size
  let default_width = document.querySelector('body').offsetWidth
  let default_height = screen.height

  d3.select('div#introduction.section').style('top','0').style('left','0')
  d3.select('div#total.section').style('top',screen.height+'px').style('left','0')
  d3.select('div#map.section').style('top',screen.height*2+'px').style('left','0')
  d3.select('div#graph1.section').style('top',screen.height*3+'px').style('left','0')
  d3.select('div#graph2.section').style('top',screen.height*4+'px').style('left','0')
  d3.select('div#ending.section').style('top',screen.height*5+'px').style('left','0')
  d3.select('footer').style('top',screen.height*6-50+'px').style('left','0')
  d3.selectAll('div.question_block').style('padding-top',screen.height*0.085+'px')
  d3.selectAll('body').transition().duration(1000).style('opacity',1)

  let svg = d3.select('#moving')
    .append('svg')
    .attr('width', default_width)
    .attr('height', default_height)
    .style('position','fixed')
    .style('top','0')
    .style('left','0')

  //////////////////////////////////////////////////////////
  /* Create Map                                           */
  //////////////////////////////////////////////////////////

  let xMapOffset = default_width/2
  let yMapOffset = default_height/1.75

  let projection = d3.geoMercator()
    .center([0, 5])
    .scale(200)
    .translate([xMapOffset,yMapOffset])

  let path = d3.geoPath()
    .projection(projection)

  let mapGroup = svg.append('g').attr('id','map').style('opacity',0)
  let mapSelector = svg.select('#map')

  mapSelector.selectAll('path')
    .data(mapData)
    .enter().append('path')
    .attr('class', d => 'geo-path' + ' ' + d.id)
    .attr('id', d => d.properties.name)
    .attr('d', path)

  //////////////////////////////////////////////////////////
  /* Create Gooey Filter                                  */
  //////////////////////////////////////////////////////////

  //SVG filter for the gooey effect
  //Code taken from http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/
  let defs = svg.append('defs')
  let filter = defs.append('filter').attr('id','gooeyCodeFilter')
  filter.append('feGaussianBlur')
    .attr('in','SourceGraphic')
    .attr('stdDeviation','10')
    //to fix safari: http://stackoverflow.com/questions/24295043/svg-gaussian-blur-in-safari-unexpectedly-lightens-image
    .attr('color-interpolation-filters','sRGB') 
    .attr('result','blur')
  filter.append('feColorMatrix')
    .attr('class', 'blurValues')
    .attr('in','blur')
    .attr('mode','matrix')
    .attr('values','1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -6')
    .attr('result','gooey')
  filter.append('feBlend')
    .attr('in','SourceGraphic')
    .attr('in2','gooey')
    .attr('operator','atop')

  //////////////////////////////////////////////////////////
  /* Create circles                                       */
  //////////////////////////////////////////////////////////

  let wealthRange = d3.extent(dataset, d => d['Wealth ($B)'])
  let circlesScale = d3.scaleSqrt()
    .range([0,100])
    .domain(wealthRange)

  let circlesGroup = svg.append('g').attr('id','circles')
  let circlesSelector = svg.select('#circles')
    .style('filter', 'url(#gooeyCodeFilter)')
    //.style('isolation','isolate') //pour plus de lag <3
  
  circlesSelector.selectAll('circle')
    .data(dataset)
    .enter()
      .append('circle')
      .attr('class',d => d.Country.split(' ').join('_'))
      .attr('id',d => d.Region)
      .attr('billion', d => d['Wealth ($B)'])
      .attr('r',d => circlesScale(d['Wealth ($B)']))
      .attr('cx',d3.randomUniform(0,default_width))
      .attr('cy',d3.randomUniform(0,default_height))
      .attr('fill',d => strToColor(d.Country.split(' ').join('_')))
      .attr('fill-opacity',0.7)
      //.style('mix-blend-mode', 'screen') //pour plus de lag <3

    //////////////////////////////////////////////////////////
    /* Map mapping                                          */
    //////////////////////////////////////////////////////////

    let nodes = circlesSelector.selectAll('circle')._groups[0]
    nodes.forEach(d => {
      d.getAttribute('r') != null ? d.setAttribute('originalR',d.getAttribute('r')) : d.setAttribute('originalR',0)
      let mapObject = mapData.find(e => e.properties.name == d.getAttribute('class').split('_').join(' '))
      if(mapObject == undefined){
        d.setAttribute('Xcapital',projection([0,0])[0])
        d.setAttribute('Ycapital',projection([0,0])[1])
      }
      else{
        let Xcapital = parseFloat(mapObject.properties.lon)
        let Ycapital = parseFloat(mapObject.properties.lat)

        d.setAttribute('Xcapital',projection([Xcapital,Ycapital])[0])
        d.setAttribute('Ycapital',projection([Xcapital,Ycapital])[1])
      }
    })

    svg.append('g').attr('id','polylines').style('opacity',0)
    let polylinesSelector = d3.select('#polylines')

    //France
    polylinesSelector
      .append('polyline')
      .attr('stroke', '#f9a729')
      .style('fill', 'none')
      .attr('stroke-width', 2)
      .attr('points', () => {
        let mapObject = mapData.find(e => e.properties.name == 'France')
        
        let Xcapital = parseFloat(mapObject.properties.lon)
        let Ycapital = parseFloat(mapObject.properties.lat)
        let Xprojeted = projection([Xcapital,Ycapital])[0]
        let Yprojeted = projection([Xcapital,Ycapital])[1]
        
        let posA = [Xprojeted,Yprojeted]
        let posB = [Xprojeted-50,Yprojeted-25]
        let posC = [Xprojeted-70,Yprojeted-25]
        return [posA, posB, posC]
      })
    polylinesSelector
      .append('text')
        .text('France')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'France')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted-120,Yprojeted-30]
          return 'translate('+pos+')'
      })
    polylinesSelector
      .append('text')
        .text('$13.73B')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'France')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted-120,Yprojeted-15]
          return 'translate('+pos+')'
      })

    //Germany
    polylinesSelector
      .append('polyline')
      .attr('stroke', '#f9a729')
      .style('fill', 'none')
      .attr('stroke-width', 2)
      .attr('points', function(d) {
        let mapObject = mapData.find(e => e.properties.name == 'Germany')
        
        let Xcapital = parseFloat(mapObject.properties.lon)
        let Ycapital = parseFloat(mapObject.properties.lat)
        let Xprojeted = projection([Xcapital,Ycapital])[0]
        let Yprojeted = projection([Xcapital,Ycapital])[1]
        
        let posA = [Xprojeted,Yprojeted]
        let posB = [Xprojeted+50,Yprojeted-50]
        let posC = [Xprojeted+100,Yprojeted-50]
        return [posA, posB, posC]
      })
    polylinesSelector
      .append('text')
        .text('Germany')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'Germany')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted+105,Yprojeted-55]
          return 'translate('+pos+')'
      })
    polylinesSelector
      .append('text')
        .text('$14.66B')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'Germany')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted+105,Yprojeted-40]
          return 'translate('+pos+')'
      })

    //United Kingdom
    polylinesSelector
      .append('polyline')
      .attr('stroke', '#f9a729')
      .style('fill', 'none')
      .attr('stroke-width', 2)
      .attr('points', function(d) {
        let mapObject = mapData.find(e => e.properties.name == 'United Kingdom')
        
        let Xcapital = parseFloat(mapObject.properties.lon)
        let Ycapital = parseFloat(mapObject.properties.lat)
        let Xprojeted = projection([Xcapital,Ycapital])[0]
        let Yprojeted = projection([Xcapital,Ycapital])[1]
        
        let posA = [Xprojeted,Yprojeted]
        let posB = [Xprojeted-50,Yprojeted-50]
        let posC = [Xprojeted-70,Yprojeted-50]
        return [posA, posB, posC]
      })
    polylinesSelector
      .append('text')
        .text('United Kingdom')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'United Kingdom')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted-140,Yprojeted-55]
          return 'translate('+pos+')'
      })
    polylinesSelector
      .append('text')
        .text('$14.34B')
        .style('fill', '#f9a729')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'United Kingdom')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted-140,Yprojeted-40]
          return 'translate('+pos+')'
      })

      //China
      polylinesSelector
        .append('polyline')
        .attr('stroke', '#fd6f30')
        .style('fill', 'none')
        .attr('stroke-width', 2)
        .attr('points', function(d) {
          let mapObject = mapData.find(e => e.properties.name == 'China')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let posA = [Xprojeted,Yprojeted]
          let posB = [Xprojeted+50,Yprojeted-50]
          let posC = [Xprojeted+150,Yprojeted-50]
          return [posA, posB, posC]
        })
    polylinesSelector
      .append('text')
        .text('China')
        .style('fill', '#fd6f30')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'China')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted+155,Yprojeted-55]
          return 'translate('+pos+')'
      })
    polylinesSelector
      .append('text')
        .text('$63.83B')
        .style('fill', '#fd6f30')
        .style('font-size','12px')
        .style('font-weight','bold')
        .attr('transform', () => {
          let mapObject = mapData.find(e => e.properties.name == 'China')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let pos = [Xprojeted+155,Yprojeted-40]
          return 'translate('+pos+')'
      })

      //Japan
      polylinesSelector
        .append('polyline')
        .attr('stroke', '#fd6f30')
        .style('fill', 'none')
        .attr('stroke-width', 2)
        .attr('points', function(d) {
          let mapObject = mapData.find(e => e.properties.name == 'Japan')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let posA = [Xprojeted,Yprojeted]
          let posB = [Xprojeted+50,Yprojeted+50]
          let posC = [Xprojeted+100,Yprojeted+50]
          return [posA, posB, posC]
        })
      polylinesSelector
        .append('text')
          .text('Japan')
          .style('fill', '#fd6f30')
          .style('font-size','12px')
          .style('font-weight','bold')
          .attr('transform', () => {
            let mapObject = mapData.find(e => e.properties.name == 'Japan')
            
            let Xcapital = parseFloat(mapObject.properties.lon)
            let Ycapital = parseFloat(mapObject.properties.lat)
            let Xprojeted = projection([Xcapital,Ycapital])[0]
            let Yprojeted = projection([Xcapital,Ycapital])[1]
            
            let pos = [Xprojeted+105,Yprojeted+45]
            return 'translate('+pos+')'
        })
      polylinesSelector
        .append('text')
          .text('$24.99B')
          .style('fill', '#fd6f30')
          .style('font-size','12px')
          .style('font-weight','bold')
          .attr('transform', () => {
            let mapObject = mapData.find(e => e.properties.name == 'Japan')
            
            let Xcapital = parseFloat(mapObject.properties.lon)
            let Ycapital = parseFloat(mapObject.properties.lat)
            let Xprojeted = projection([Xcapital,Ycapital])[0]
            let Yprojeted = projection([Xcapital,Ycapital])[1]
            
            let pos = [Xprojeted+105,Yprojeted+60]
            return 'translate('+pos+')'
        })


      //U.S.
      polylinesSelector
        .append('polyline')
        .attr('stroke', '#91dcea')
        .style('fill', 'none')
        .attr('stroke-width', 2)
        .attr('points', function(d) {
          let mapObject = mapData.find(e => e.properties.name == 'United States')
          
          let Xcapital = parseFloat(mapObject.properties.lon)
          let Ycapital = parseFloat(mapObject.properties.lat)
          let Xprojeted = projection([Xcapital,Ycapital])[0]
          let Yprojeted = projection([Xcapital,Ycapital])[1]
          
          let posA = [Xprojeted,Yprojeted]
          let posB = [Xprojeted+50,Yprojeted+50]
          let posC = [Xprojeted+70,Yprojeted+50]
          return [posA, posB, posC]
        })
      polylinesSelector
        .append('text')
          .text('United States')
          .style('fill', '#91dcea')
          .style('font-size','12px')
          .style('font-weight','bold')
          .attr('transform', () => {
            let mapObject = mapData.find(e => e.properties.name == 'United States')
            
            let Xcapital = parseFloat(mapObject.properties.lon)
            let Ycapital = parseFloat(mapObject.properties.lat)
            let Xprojeted = projection([Xcapital,Ycapital])[0]
            let Yprojeted = projection([Xcapital,Ycapital])[1]
            
            let pos = [Xprojeted+75,Yprojeted+45]
            return 'translate('+pos+')'
        })
      polylinesSelector
        .append('text')
          .text('$105.99B')
          .style('fill', '#91dcea')
          .style('font-size','12px')
          .style('font-weight','bold')
          .attr('transform', () => {
            let mapObject = mapData.find(e => e.properties.name == 'United States')
            
            let Xcapital = parseFloat(mapObject.properties.lon)
            let Ycapital = parseFloat(mapObject.properties.lat)
            let Xprojeted = projection([Xcapital,Ycapital])[0]
            let Yprojeted = projection([Xcapital,Ycapital])[1]
            
            let pos = [Xprojeted+75,Yprojeted+60]
            return 'translate('+pos+')'
        })

    //////////////////////////////////////////////////////////
    /* Set-up the force                                     */
    //////////////////////////////////////////////////////////

    resetForce()

    let force = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-1))
      .force('center', d3.forceCenter(default_width / 2, default_height / 2.25))
      .force('collision', d3.forceCollide().radius(d => d.getAttribute('r')*1.25).strength(0.020))
      .on('tick', ticked)

    function ticked() {
      let u = d3.selectAll('circle')
        .data(nodes)

      u.enter()
        .merge(u)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      u.exit().remove()
    }

    function resetForce(){
      nodes.forEach(d => {
        d.vx = 0
        d.vy = 0
        d.x = default_width/2
        d.y = default_height/2.25
      })
    }

    //////////////////////////////////////////////////////////
    /* Consigne                                    */
    //////////////////////////////////////////////////////////

    let step1txt = svg.append('g')
      .attr('id','step1txt')  
      .append('text')
        .attr('x',default_width * 0.85)
        .attr('y',default_height * 0.1)
        .attr('fill','black')
        .attr('opacity',0)
        .text('Scroll to continue ↓')
        .transition().duration(1000).delay('2000')
        .attr('opacity',1)
        
    //////////////////////////////////////////////////////////
    /* First Bubble Text                                    */
    //////////////////////////////////////////////////////////

    let step2txt = svg.append('g')
      .attr('id','step2txt')  
      .append('text')
        .attr('x',default_width / 2.5)
        .attr('y',default_height / 2.25)
        .attr('fill','white')
        .attr('opacity',0)

    //////////////////////////////////////////////////////////
    /* Region circlesGroup                                  */
    //////////////////////////////////////////////////////////
    let regions = ['Africa', 'Asia-Pacific', 'Europe', 'Latin America', 'North America']

    let step4txt = svg.append('g')
      .attr('id','step4txt')
      .style('opacity',0)

    svg.select('#step4txt').selectAll('#step4region')
      .data(regions)
      .enter()
      .append('text')
        .attr('id','step4region')
        .attr('class',d => d)

    svg.select('#step4txt').selectAll('#step4percentage')
      .data(regions)
      .enter()
      .append('text')
        .attr('id','step4percentage')
        .attr('class',d => d)

    svg.select('#step4txt').selectAll('#step4total')
      .data(regions)
      .enter()
      .append('text')
        .attr('id','step4total')
        .attr('class',d => d)

    //////////////////////////////////////////////////////////
    /* Region Wealth Comparaison                            */
    //////////////////////////////////////////////////////////

    let step5txt = svg.append('g')
      .attr('id','step5txt')
      .attr('opacity',0)

    svg.select('#step5txt').selectAll('#step5legend')
      .data(regions)
      .enter()
      .append('text')
        .attr('id','step5legend')
        .attr('class',d => d)
        .text(d=>d)
        
    svg.select('#step5txt').selectAll('#step5annotation')
      .data(['United States','Japan','China','France','United Kingdom','Germany'])
      .enter()
      .append('text')
        .attr('id','step5annotation')

    svg.select('#step5txt').selectAll('#step5total')
      .data(['United States','Japan','China','France','United Kingdom','Germany'])
      .enter()
      .append('text')
        .attr('id','step5total')


    //////////////////////////////////////////////////////////
    /* Thank You <3                                         */
    //////////////////////////////////////////////////////////
    let step6txt = svg.append('g')
      .attr('id','step6txt')

    svg.select('#step6txt')
      .append('text')
        .attr('id','step6txt')
        .attr('class','endingText')
        .attr('x',default_width*0.45)
        .attr('y',default_height/1.85)
        .attr('fill','gray')
        .attr('opacity',0)
        .text('Thank you !')
}

//////////////////////////////////////////////////////////
/* Scroll Listener                                      */
//////////////////////////////////////////////////////////

let last_call = 'step1'
let scrollValue = 0
document.addEventListener('scroll',() => {
  scrollValue = document.querySelector('html').scrollTop
  //console.log('scrollValue: ',document.querySelector('html').scrollTop)

  let default_width = document.querySelector('body').offsetWidth
  let default_height = screen.height

  let regions = ['Africa', 'Asia-Pacific', 'Europe', 'Latin America', 'North America']
  let regionColor = d3.scaleOrdinal(['#eb1e2c','#fd6f30','#f9a729','#5fbb68','#91dcea'])
    .domain(regions)
  let regionTotal = d3.scaleOrdinal(['$4.115B','$141.201B','$90.467B','$9.904B','$114.607B'])
    .domain(regions)
  let regionPercentage = d3.scaleOrdinal(['1.14%','39,17%','25.1%','2.75%','31.84%'])
    .domain(regions)

  let countries = ['United States','Japan','China','France','United Kingdom','Germany']
  let countriesTotal = d3.scaleOrdinal(['$105.99B','$24.99B','$63.83B','$13.73B','$14.34B','$14.66B'])
    .domain(countries)

  X1 = default_width/6
  Y1t = default_height/5
  Y1b = default_height/2.25
  Y2 = default_height/6

  let regionX1 = d3.scaleOrdinal([X1*4,X1*5,X1*3,X1*2,X1])
    .domain(regions)
  let regionY1 = d3.scaleOrdinal([Y1b,Y1t,Y1t,Y1b,Y1t])
    .domain(regions)

  let regionX2 = d3.scalePow()
    .domain([0,100])
    .range([default_width*0.25,default_width*0.75])
  let regionY2 = d3.scaleOrdinal([Y2*5,Y2,Y2*3,Y2*4,Y2*2])
    .domain(regions)

  let map = d3.select('svg #map')
  let polylines = d3.select('#polylines')
  let step1txt = d3.select('#step1txt>text')
  let step2txt = d3.select('#step2txt>text')
  let step2parag = d3.select('#step2para')
  let step4txt = d3.selectAll('#step4txt')
  let step4parag = d3.select('#step4para')
  let step5txt = d3.selectAll('#step5txt')
  let step5parag = d3.select('#step5para')
  let step6txt = d3.selectAll('#step6txt>text')
  let step6parag = d3.select('#step6para')
  let circles = d3.selectAll('circle')
  let nodes = d3.selectAll('circle')._groups[0]
  let force = d3.forceSimulation(nodes)

  let totalWealth = 360474
  let africaWealth = 4115
  let asiaWealth = 141201
  let europeWealth = 90647
  let latinAmericaWealth = 9904
  let northAmericaWealth = 114607
  let circlesScale = d3.scaleSqrt()
    .range([0,100])
    .domain([0,totalWealth])

  let regionRadius = d3.scaleOrdinal([africaWealth,asiaWealth,europeWealth,latinAmericaWealth,northAmericaWealth])
    .domain(regions)

  //////////////////////////////////////////////////////////
  /* Step 1                                               */
  //////////////////////////////////////////////////////////
  if(last_call != 'step1' && scrollValue < default_height){
    last_call = 'step1'

    force.stop()
    resetForce()

    map.transition().duration(3000).style('opacity',0)
    polylines.transition().duration(1000).style('opacity',0)
    step1txt.transition().duration(1000).style('opacity',1)
    step2txt.transition().duration(1000).style('opacity',0).on('end',() => step2txt.text(''))
    step2parag.transition().duration(1000).style('opacity',0)

    circles
      .transition().duration(1000)
      .attr('r', d => d.getAttribute('originalR'))
      .attr('fill',d => strToColor(d.getAttribute('class')))

    step2txt.transition().duration(1000).delay(1000).style('opacity',0)
      .on('end',() => step2txt.text(''))

    force
      .force('charge', d3.forceManyBody().strength(-1))
      .force('center', d3.forceCenter(default_width / 2, default_height / 2.25))
      .force('collision', d3.forceCollide().radius(d => d.getAttribute('r')*1.25).strength(0.001))
      .on('tick', ticked)
      .restart()
  }

  //////////////////////////////////////////////////////////
  /* Step 2                                               */
  //////////////////////////////////////////////////////////
  else if(last_call != 'step2' && scrollValue > default_height && scrollValue < default_height*2){
    last_call = 'step2'
    
    force.stop()

    map.transition().duration(1000).style('opacity',0)
    polylines.transition().duration(1000).style('opacity',0)
    step1txt.transition().duration(1000).style('opacity',0)
    step2txt.transition().duration(1000).style('opacity',1)
    step2parag.transition().duration(1000).delay(6000).style('opacity',1)

    circles
      .transition().duration(3000)
      .attr('cx', default_width/2)
      .attr('cy', default_height/2.25)
      .attr('fill','orange')
      .on('end', resetForce)

    circles
      .transition().duration(3000).delay(3000)
      .attr('r', d => circlesScale(totalWealth)*3)

    step2txt.transition().duration(3000).delay(3000).attrTween('text',() => {
        let selection = step2txt
        let start = 0
        let end = totalWealth
        let interpolator = d3.interpolateNumber(start,end)
        return t => selection.text('$'+Math.round(interpolator(t))+' Billion') 
    })


  }
  //////////////////////////////////////////////////////////
  /* Step 3                                               */
  //////////////////////////////////////////////////////////
  else if(last_call != 'step3' && scrollValue > default_height*2 && scrollValue < default_height*3){
    last_call = 'step3'

    force.stop()
    resetForce()

    map.transition().duration(1500).style('opacity',1)
    polylines.transition().duration(1000).delay(6000).style('opacity',1)
    step2txt.transition().duration(1000).style('opacity',0).on('end',() => step2txt.text(''))
    step2parag.transition().duration(1000).style('opacity',0)
    step4txt.transition().duration(1000).style('opacity',0)
    step4parag.transition().duration(1000).style('opacity',0)

    circles
      .transition().duration(1000)
      .attr('cx', default_width/2)
      .attr('cy', default_height/2.25)
      .attr('fill','orange')
      .attr('r', d => d.getAttribute('originalR')/2)

    circles
      .transition().duration(1000).delay((d,i) => 1000+i*20)
      .attr('r', d => d.getAttribute('originalR')/2)
      .attr('cx', d => d.getAttribute('Xcapital'))
      .attr('cy', d => d.getAttribute('Ycapital'))
      .attr('fill', d => regionColor(d.getAttribute('id')))
  }
  //////////////////////////////////////////////////////////
  /* Step 4                                               */
  //////////////////////////////////////////////////////////
  else if(last_call != 'step4' && scrollValue > default_height*3 && scrollValue < default_height*4){
    last_call = 'step4'

    force.stop()
    resetForce()

    map.transition().duration(3000).style('opacity',0)
    polylines.transition().duration(1000).style('opacity',0)
    step4txt.transition().duration(3000).style('opacity',1)
    step4parag.transition().duration(3000).style('opacity',1)
    step5txt.transition().duration(1000).style('opacity',0)
    step5parag.transition().duration(1000).style('opacity',0)

    step4txt
      .selectAll('#step4region')
      .data(regions)
      .attr('fill', d => regionColor(d))
      .attr('y', d => {
        if(d == 'Africa' || d == 'Latin America'){return regionY1(d)+default_height*0.05}
        else {return regionY1(d)+default_height*0.15}
      })
      .attr('x', d => regionX1(d))
      .text(d => d)
      
    step4txt
      .selectAll('#step4percentage')
      .data(regions)
      .attr('fill', d =>  regionColor(d))
      .attr('y', d => {
        if(d == 'Africa' || d == 'Latin America'){return regionY1(d)+default_height*0.05+50}
        else {return regionY1(d)+default_height*0.15+50}
      })
      .attr('x', d => regionX1(d))
      .attr('font-size','37px')
      .attr('font-weight','bold')
      .text(d => regionPercentage(d))

    step4txt
      .selectAll('#step4total')
      .data(regions)
      .attr('fill', d => regionColor(d))
      .attr('y', d => {
        if(d == 'Africa' || d == 'Latin America'){return regionY1(d)+default_height*0.05+15}
        else {return regionY1(d)+default_height*0.15+15}
      })
      .attr('x', d => regionX1(d))
      .text(d => regionTotal(d))

    circles
      .transition().duration(1000)
      .attr('r', d => d.getAttribute('originalR'))
      .attr('fill', d => regionColor(d.getAttribute('id')))
      .on('end', () => {
        force
          .force('charge', d3.forceManyBody().strength(-0.5))
          .force('x',d3.forceX().x(d => regionX1(d.getAttribute('id'))).strength(0.06))
          .force('y', d3.forceY().y(d => regionY1(d.getAttribute('id'))).strength(0.06))
          .force('collision', d3.forceCollide().radius(d => d.getAttribute('r')*1).strength(0.2))
          .on('tick', ticked)
          .restart()
      })

  }
  //////////////////////////////////////////////////////////
  /* Step 5                                               */
  //////////////////////////////////////////////////////////
  else if(last_call != 'step5' && scrollValue > default_height*4 && scrollValue < default_height*5 ){
    last_call = 'step5'
    
    force.stop()

    map.transition().duration(3000).style('opacity',0)
    polylines.transition().duration(1000).style('opacity',0)
    step4txt.transition().duration(1000).style('opacity',0)
    step4parag.transition().duration(1000).style('opacity',0)
    step5parag.transition().duration(1000).delay(1000).style('opacity',1)
    step5txt.transition().duration(1000).style('opacity',1)
    step6txt.transition().duration(1000).style('opacity',0)
    step6parag.transition().duration(1000).style('opacity',0)
    step5txt.selectAll('#step5annotation').style('opacity',0)
    step5txt.selectAll('#step5total').style('opacity',0)


    step5txt.selectAll('#step5legend')
      .data(regions)
      .attr('fill', d => regionColor(d))
      .attr('x', default_width*0.85)
      .attr('y', d => regionY2(d))
      .text(d => d)

    circles
      .transition().duration(1000)
      .attr('r', d => d.getAttribute('originalR'))
      .attr('fill', d => regionColor(d.getAttribute('id')))
      .on('end', () => {
        force
          .force('charge', d3.forceManyBody().strength(-0.6))
          .force('x',d3.forceX().x(d => regionX2(d.getAttribute('originalR'))).strength(0.5))
          .force('y', d3.forceY().y(d => regionY2(d.getAttribute('id'))).strength(0.5))
          .force('collision', d3.forceCollide().radius(d => d.getAttribute('r')*1).strength(0.2))
          .on('tick', ticked)
          .on('end', () => {
            step5txt.selectAll('#step5annotation')
              .data(countries)
              .attr('fill', 'white')
              .text(d => d == 'United Kingdom' ? 'UK' : d)
              .attr('x',d => d3.select('circle.'+d.split(' ').join('_')).attr('cx')-30+'px')
              .attr('y',d => d3.select('circle.'+d.split(' ').join('_')).attr('cy')-15+'px')
              .transition().duration(1000).style('opacity',1)

            step5txt.selectAll('#step5total')
              .data(countries)
              .attr('fill', 'white')
              .text(d => countriesTotal(d))
              .attr('x',d => d3.select('circle.'+d.split(' ').join('_')).attr('cx')-30+'px')
              .attr('y',d => d3.select('circle.'+d.split(' ').join('_')).attr('cy')+20+'px')
              .attr('font-weight','bold')
              .transition().duration(1000).style('opacity',1)
          })
          .restart()
      })

  }
  //////////////////////////////////////////////////////////
  /* Step 6                                               */
  //////////////////////////////////////////////////////////
  else if(last_call != 'step6' && scrollValue > default_height*5-25){
    last_call = 'step6'

    force.stop()

    map.transition().duration(3000).style('opacity',0)
    polylines.transition().duration(1000).style('opacity',0)
    step5txt.transition().duration(1000).style('opacity',0)
    step5parag.transition().duration(1000).style('opacity',0)

    step6parag.transition().duration(1000).style('opacity',1)
    step6txt.transition().duration(5000).style('opacity',1)

    circles
      .transition().duration(5000)
      .attr('r', d => d.getAttribute('r')*3)
      .attr('fill',d => strToColor(d.getAttribute('class')))

    force
      .force('charge', d3.forceManyBody().strength(-1))
      .force('x', d3.forceX().x(d3.randomUniform(0,default_width)).strength(0.05))
      .force('y', d3.forceY().y(d3.randomUniform(0,default_height)).strength(0.05))
      .force('collision', d3.forceCollide().radius(d => d.getAttribute('r')*1.5).strength(0.05))
      .on('tick', ticked)
      .restart()
  }


  function ticked() {
    circles
      .data(nodes)

    circles.enter()
      .merge(circles)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    circles.exit().remove()
  }

  function resetForce(){
    nodes.forEach(d => {
      d.vx = 0
      d.vy = 0
      d.x = default_width/2
      d.y = default_height/2.25
    })
  }
})



//////////////////////////////////////////////////////////
/* Other                                                */
//////////////////////////////////////////////////////////

function strToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return '#'+'00000'.substring(0, 6 - c.length) + c;
}

//////////////////////////////////////////////////////////
/* Call                                                 */
//////////////////////////////////////////////////////////
load_data()