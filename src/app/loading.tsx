import Loader from "@/components/Loader";

const loading = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <Loader />
    </div>
  );
};

export default loading;
