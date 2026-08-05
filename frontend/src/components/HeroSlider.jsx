import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function HeroSlider(){

const images=[
"/src/assets/banner1.jpg",
"/src/assets/banner2.jpg"
];


return(
<Slider autoplay dots>

{
images.map((img,index)=>(
<img 
key={index}
src={img}
className="h-100 w-full object-cover"
/>
))
}

</Slider>
)

}

export default HeroSlider;