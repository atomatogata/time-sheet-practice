// データ
var category = [
  "睡眠",
  "朝ご飯",
  "洗濯",
  "テレビ",
  "YouTube",
  "ゲーム",
  "昼ごはん",
  "ランニング",
  "パソコン",
  "夜ご飯",
  "お風呂",
];
// バーの高さ（原文だと未定義？理由不明）
let barHeight = 20;
// input要素の値を取得
// 時間データセット（to~と変換しないとエラーのため）
let dateListItem01 = new Date("2023/02/26").toISOString();
let inputFieldDateListItem = document.getElementById("js-datepicker");
let dateListItem02 = new Date(inputFieldDateListItem.value).toISOString();
let dateListItem03 = new Date("2023/02/26 19:00:00").toISOString();
let dateListItem04 = new Date("2023/02/26 10:00:00").toISOString();
let dateListItem05 = new Date("2023/02/26 14:00:00").toISOString();
let dateListItem06 = new Date("2023/02/26 15:00:00").toISOString();
let dateListItem07 = new Date("2023/02/26 16:00:00").toISOString();
var datasets = [
  {
    date: moment(dateListItem01),
    schedule: [
      {
        categoryNo: 0,
        from: moment(dateListItem02),
        to: moment(dateListItem03),
      },
      {
        categoryNo: 1,
        from: moment(dateListItem04),
        to: moment(dateListItem05),
      },
      {
        categoryNo: 3,
        from: moment(dateListItem06),
        to: moment(dateListItem07),
      },
    ],
  },
];

// X軸の設定
var width = 900,
  height = 200;
var padding = { top: 10, right: 10, bottom: 10, left: 75 };
var dataset = datasets[0];
var timelineStartTime = moment(dataset.date.startOf("day"));
var timelineEndTime = moment(moment(dataset.date))
  .add(1, "days")
  .startOf("day");
var svg = d3
  .select("#timeline-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// X軸の時間の設定
var xScale = d3
  .scaleTime()
  .domain([timelineStartTime, timelineEndTime])
  .range([padding.left, width - padding.right]);

var chartHeight = height - padding.top - padding.bottom;

var xAxis = d3
  .axisBottom(xScale)
  // 時間の刻み
  .ticks(15)
  .tickSize(-chartHeight)
  .tickFormat(d3.timeFormat("%H:%M"));
var gX = svg
  .append("g")
  .attr("transform", "translate(" + 0 + "," + (height - padding.bottom) + ")")
  .call(xAxis);

var dateDispFormat = "M月D日";
var chartCenterY = padding.top + chartHeight / 2;
svg
  .append("text")
  .text(dataset.date.format(dateDispFormat))
  .attr("x", 10)
  .attr("y", chartCenterY)
  .attr("dy", "0.5rem");

var scheduleG = svg
  .selectAll()
  .data(dataset.schedule)
  // 新しい要素への更新命令
  .enter()
  .append("g");

var schedule = scheduleG
  .append("rect") //SVGの四角形の描写はrect要素を使用する
  // X座標
  .attr("x", function (d) {
    return xScale(d["from"]);
  })
  .attr("y", chartCenterY - barHeight / 2)
  .attr("width", function (d) {
    return xScale(d["to"]) - xScale(d["from"]);
  })
  .attr("height", barHeight)
  .attr("fill", function (d) {
    return d3.schemeCategory10[d.categoryNo % 10];
  });

// スケールの変更に応じて再計算する関数
var zoomedXScale = xScale;
var calcScheduleX = function (d) {
  return zoomedXScale(d["from"]);
};
var calcScheduleWidth = function (d) {
  return zoomedXScale(d["to"]) - zoomedXScale(d["from"]);
};

// This code takes a moment object and rounds the minutes to the nearest 5 minutes
// and then returns the new moment object
var makeRoundTime = function (time) {
  var roundMinutesStr = (
    "0" + String(Math.round(moment(time).minute() / 5) * 5)
  ).slice(-2);
  if (roundMinutesStr === "60") {
    roundMinutesStr = "00";
    time.add(1, "hours");
  }
  return moment(
    new Date(
      moment(time).format("YYYY/MM/DD HH:" + roundMinutesStr.slice(-2) + ":00")
    )
  );
};

// ドラッグ開始時のイベント
var dragStart = function (d) {
  // When a user clicks on a link, stop propagation of the click event.
  // This will prevent the link from being followed.
  // This also prevents any parent elements from receiving the click event.
  d3.select(this).classed("dragging", true).style("opacity", 0.7);
};

var dragEnd = function (d) {
  d["from"] = makeRoundTime(d["from"]);
  d["to"] = makeRoundTime(d["to"]);
  d3.select(this)
    .classed("dragging", false)
    .style("opacity", 1)
    .attr("x", calcScheduleX)
    .attr("width", calcScheduleWidth);
};

var scheduleDrag = d3
  .drag()
  .on("start", dragStart)
  .on("drag", function (event, d) {
    var between = moment(d["to"]).diff(moment(d["from"]), "minutes");
    console.log(between);
    var fromTime = moment(
      zoomedXScale.invert(zoomedXScale(d["from"]) + event.dx)
    );
    var toTime = moment(fromTime).add(between, "minutes");

    if (timelineStartTime.diff(fromTime) > 0) return;
    else if (timelineEndTime.diff(toTime) < 0) return;

    d["from"] = fromTime;
    d["to"] = toTime;
    d3.select(this).attr("x", calcScheduleX);

		//Dragで変更された値を時間も含めて#js-datepickerのvalueにに反映させる
		var date = d["from"];
		var year = date.year();
		var month = date.month() + 1;
		var day = date.date();
		var hour = date.hour();
		var minute = date.minute();
		var value = year + "/" + month + "/" + day + " " + hour + ":" + minute;
		document.getElementById("js-datepicker").value = value;


  })
  .on("end", dragEnd);

schedule
  .style("cursor", "move")
  .style("mix-blend-mode", "multiply")
  .call(scheduleDrag);

	// inputの内容が変更されたときに描写されたscheduleのrectSVGを更新する
	// Jqueryは不使用で
	var input = document.getElementById("js-datepicker");
	input.addEventListener("change", function () {
		var value = new Date(input.value);
		var newSchedule = [
			{
				categoryNo: 0,
				from: moment(value),
				to: moment(value).add(1, "hours"),
			},
		];
		dataset.schedule = newSchedule;
		scheduleG
			.data(dataset.schedule)
			.select("rect")
			.attr("x", calcScheduleX)
			.attr("width", calcScheduleWidth);
	}
	);

