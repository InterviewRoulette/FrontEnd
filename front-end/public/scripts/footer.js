var Footer = React.createClass({
	render: function() {
		return (
			<footer>
				<div className="container textRight">
					<a href="takeinterview.html"><div className="button getstarted button_dark">Get Started</div></a>
				</div>
			</footer>
		);
	}
});

ReactDOM.render(
  <Footer />,
  document.getElementById('footer')
);